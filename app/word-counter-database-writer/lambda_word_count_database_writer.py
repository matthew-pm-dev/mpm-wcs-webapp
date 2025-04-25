import json
import boto3
import random

dynamodb = boto3.client('dynamodb')

def get_sharded_username(username):
    if username == 'anonymous':
        shard_id = random.randint(0, 9)
        return f'anonymous#{shard_id}'
    return username

def lambda_handler(event, context):
    for record in event['Records']:
        try:
            body = json.loads(record['body'])
            s3_filename = body['s3_filename']
            original_filename = body['original_filename']
            username = body['username']
            frequent_words = body['frequent_words']
            upload_date = body['upload_date']

            sharded_username = get_sharded_username(username)

            request_items = [
                {
                    'PutRequest': {
                        'Item': {
                            'ShardedUsername': {'S': sharded_username},
                            'UUIDWord': {'S': f'{s3_filename}#{word}'},
                            'UUID': {'S': s3_filename},
                            'Word': {'S': word},
                            'Count': {'N': str(count)},
                            'OriginalFilename': {'S': original_filename},
                            'Username': {'S': username},
                            'UploadDate': {'S': upload_date}
                        }
                    }
                }
                for word, count in frequent_words.items()
            ]
            response = dynamodb.batch_write_item(RequestItems={'WordCountTable': request_items})
            if 'UnprocessedItems' in response and response['UnprocessedItems']:
                raise Exception(f"Unprocessed items remain: {response['UnprocessedItems']}")
            print(f"Successfully wrote {len(frequent_words)} items to DynamoDB for {s3_filename}")
        except Exception as e:
            print(f"Error processing SQS message: {e}")
            raise