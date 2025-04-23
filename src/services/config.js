import gql from 'graphql-tag';

export const APPSYNC_ENDPOINT = 'https://zu342ruj2feipo7jf724for7um.appsync-api.us-east-1.amazonaws.com/graphql';
export const WS_ENDPOINT = 'wss://zu342ruj2feipo7jf724for7um.appsync-realtime-api.us-east-1.amazonaws.com/graphql';
export const IDENTITY_POOL_ID = 'us-east-1:57284626-3bd7-4082-9707-69d1f1829f04';
export const USER_POOL_ID = 'us-east-1_yZQjPS2bb';
export const USER_POOL_APP_CLIENT_ID = '60bci4bg482ih64aok2lqclu6p';

export const generatePresignedUrlQuery = gql`
    query GeneratePresignedUrl($key: String!, $contentType: String!, $originalFilename: String!, $username: String!) {
        generatePresignedUrl(key: $key, contentType: $contentType, originalFilename: $originalFilename, username: $username) {
            presignedUrl
        }
    }
`;

export const subscriptionQuery = gql`
    subscription onProcessingComplete($s3Filename: String!) {
        onProcessingComplete(s3Filename: $s3Filename) {
            s3Filename
            originalFilename
            frequentWords { word count }
        }
    }
`;

export const getTopWordCountsQuery = gql`
    query GetTopWordCounts($word: String!, $limit: Int!) {
        getTopWordCounts(word: $word, limit: $limit) {
            word
            count
            originalFilename
            username
        }
    }
`;

export const getMyUploadsQuery = gql`
    query GetMyUploads {
        getMyUploads {
            s3Filename
            originalFilename
            word
            count
            uploadDate
        }
    }
`;