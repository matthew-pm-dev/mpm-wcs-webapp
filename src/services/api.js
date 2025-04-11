import { generateClient } from '@aws-amplify/api';
import { APPSYNC_ENDPOINT, WS_ENDPOINT, generatePresignedUrlQuery, subscriptionQuery, getTopWordCountsQuery } from './config';

// Create a GraphQL client with the endpoint
const client = generateClient({
    aws_appsync_graphqlEndpoint: APPSYNC_ENDPOINT,
    aws_appsync_region: 'us-east-1',
    aws_appsync_authenticationType: 'AWS_IAM',
});

// Generate a presigned URL for S3 upload
export async function getPresignedUrl(file) {
    const uniqueKey = `uploads/${window.crypto.randomUUID()}-${file.name}`;
    const contentType = file.type || 'application/octet-stream';

    const response = await client.graphql({
        query: generatePresignedUrlQuery,
        variables: {
            key: uniqueKey,
            originalFilename: file.name,
            contentType: contentType,
        },
    });

    console.log('Presigned URL response:', response);

    if (response.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(response.errors)}`);
    }

    return { presignedUrl: response.data.generatePresignedUrl.presignedUrl, s3Filename: uniqueKey };
}

export async function uploadFile(file, updateStatus) {
    updateStatus('Generating unique key...');
    try {
        const { presignedUrl, s3Filename } = await getPresignedUrl(file);
        updateStatus('Uploading to S3...');

        const contentType = file.type || 'application/octet-stream';
        const uploadResponse = await fetch(presignedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': contentType,
            },
        });

        console.log('S3 upload response:', uploadResponse);

        if (uploadResponse.ok) {
            updateStatus('Upload successful! Waiting for results...');
            return s3Filename;
        } else {
            throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }
    } catch (error) {
        updateStatus('Error: Check console for details');
        console.error('UploadFile error:', error);
        throw error;
    }
}

export function subscribeToResults(s3Filename, originalFilename, updateStatus, callback) {
    const subscription = client
        .graphql({
            query: subscriptionQuery,
            variables: { s3Filename },
        })
        .subscribe({
            next: ({ data }) => {
                const result = data.onProcessingComplete;
                console.log('Subscription data:', result);
                callback(result); // Pass the raw result directly
                subscription.unsubscribe();
            },
            error: (error) => {
                console.error('Subscription error:', error);
                updateStatus('Subscription error');
            },
        });
}

export async function searchLeaderboard(word, updateStatus) {
    updateStatus(`Searching for "${word}"...`);

    try {
        const response = await client.graphql({
            query: getTopWordCountsQuery,
            variables: {
                word: word,
                limit: 10,
            },
        });

        console.log('GraphQL response:', response);

        if (response.errors) {
            throw new Error(`GraphQL errors: ${JSON.stringify(response.errors)}`);
        }

        return response.data.getTopWordCounts; // Return the raw data directly
    } catch (error) {
        updateStatus('Error: Check console for details');
        console.error('SearchLeaderboard error:', error);
        throw error;
    }
}