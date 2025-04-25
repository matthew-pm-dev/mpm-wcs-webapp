import json
import boto3
import re
from collections import Counter
import os
import requests
from aws_requests_auth.aws_auth import AWSRequestsAuth
import urllib.parse
from datetime import datetime

# AWS clients/resources
s3_client = boto3.client('s3')
sqs = boto3.client('sqs')

APPSYNC_API_ENDPOINT = 'https://zu342ruj2feipo7jf724for7um.appsync-api.us-east-1.amazonaws.com/graphql'
REGION = 'us-east-1'

QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/050752652297/WordCountWriteQueue'

UPLOAD_BUCKET = os.environ.get('UPLOAD_BUCKET', 'mpm-bucket-wordcount-document-store')

# Load stopwords from layer
def load_stopwords():
    stopwords_set = set()
    for language in ['english', 'french', 'spanish']:
        file_path = f'/opt/python/stopwords/{language}.json'
        try:
            with open(file_path, 'r') as f:
                stopwords_set.update(json.load(f))
                print(f"Successfully loaded {file_path}")
        except FileNotFoundError as e:
            print(f"Error loading {file_path}: {e}")
    if not stopwords_set:
        raise Exception("No stopwords files found")
    return stopwords_set

STOP_WORDS = load_stopwords()

def count_words(bucket, key):
    filename = '/tmp/' + os.path.basename(key)
    s3_client.download_file(bucket, key, filename)
    with open(filename, 'r', encoding='utf-8') as file:
        text = file.read().lower()
    words = re.split(r'[ \t\n.,!?;:()\'"“”‘’…—#]+', text)
    filtered_words = [word for word in words if word and word not in STOP_WORDS]
    word_counts = Counter(filtered_words)
    return {word: count for word, count in word_counts.items() if count >= 10}

def trigger_appsync_subscription(s3_filename, original_filename, frequent_words):
    mutation = """
        mutation CompleteProcessing($s3Filename: String!, $originalFilename: String!, $frequentWords: [WordCountInput!]!) {
            completeProcessing(s3Filename: $s3Filename, originalFilename: $originalFilename, frequentWords: $frequentWords) {
                s3Filename
                originalFilename
                frequentWords { word count }
            }
        }
    """
    variables = {
        "s3Filename": s3_filename,
        "originalFilename": original_filename,
        "frequentWords": [{"word": word, "count": count} for word, count in frequent_words.items()]
    }
    payload = {'query': mutation, 'variables': variables}

    # Get IAM credentials from the Lambda environment
    auth = AWSRequestsAuth(
        aws_access_key=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        aws_token=os.environ['AWS_SESSION_TOKEN'],
        aws_host=urllib.parse.urlparse(APPSYNC_API_ENDPOINT).netloc,
        aws_region=REGION,
        aws_service='appsync'
    )

    # Make the request to AppSync with IAM authentication
    headers = {'Content-Type': 'application/json'}
    response = requests.post(
        APPSYNC_API_ENDPOINT,
        headers=headers,
        json=payload,
        auth=auth
    )
    print(f"AppSync mutation response: {response.status_code} - {response.text}")
    if response.status_code != 200:
        raise Exception(f"AppSync mutation failed: {response.text}")
    response_data = response.json()
    if 'errors' in response_data:
        raise Exception(f"AppSync mutation returned errors: {response_data['errors']}")

def send_to_sqs(s3_filename, original_filename, username, frequent_words, upload_date):
    message_body = {
        's3_filename': s3_filename,
        'original_filename': original_filename,
        'username': username,
        'frequent_words': frequent_words,
        'upload_date': upload_date.strftime('%Y-%m-%d')
    }
    response = sqs.send_message(
        QueueUrl=QUEUE_URL,
        MessageBody=json.dumps(message_body)
    )
    print(f"SQS message sent: {response['MessageId']}")

def lambda_handler(event, context):
    try:
        for record in event['Records']:
            bucket = record['s3']['bucket']['name']
            s3_filename = record['s3']['object']['key']

            if bucket != UPLOAD_BUCKET:
                print(f"Skipping event for bucket {bucket} - expected {UPLOAD_BUCKET}")
                continue

            head_response = s3_client.head_object(Bucket=bucket, Key=s3_filename)
            original_filename = head_response['Metadata'].get('original-filename', 'unknown')
            username = head_response['Metadata'].get('username', 'anonymous')
            upload_date = head_response['LastModified'].date()

            frequent_words = count_words(bucket, s3_filename)

            if frequent_words:
                trigger_appsync_subscription(s3_filename, original_filename, frequent_words)
                send_to_sqs(s3_filename, original_filename, username, frequent_words, upload_date)

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Processing completed, results sent via AppSync and queued for DB write'})
        }
    except Exception as e:
        print(f"Error in Lambda execution: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }