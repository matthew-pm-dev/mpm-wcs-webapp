import boto3
import os

s3_client = boto3.client('s3')
BUCKET_NAME = os.environ.get('BUCKET_NAME', 'mpm-bucket-wordcount-document-store')

def lambda_handler(event, context):
    try:
        args = event['arguments']
        key = args['key']
        content_type = args['contentType']
        original_filename = args['originalFilename']
        username = args['username']

        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': BUCKET_NAME,
                'Key': key,
                'ContentType': content_type,
                'Metadata': {
                    'original-filename': original_filename,
                    'username': username
                }
            },
            ExpiresIn=300
        )
        return {"presignedUrl": presigned_url}
    except Exception as e:
        return {"error": str(e)}