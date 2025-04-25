export function request(ctx) {
    return {
        version: "2018-05-29",
        operation: "Query",
        index: "WordCountIndex",
        query: {
            expression: "Word = :word",
            expressionValues: {
                ":word": util.dynamodb.toDynamoDB({ S: ctx.args.word }),
            },
        },
        scanIndexForward: false,
        limit: ctx.args.limit,
    };
}

export function response(ctx) {
    if (ctx.error) {
        throw new Error(ctx.error.message);
    }
    if (!ctx.result?.items || ctx.result.items.length === 0) {
        return [];
    }
    const entries = ctx.result.items.map(item => ({
        word: item.Word,
        count: item.Count,
        originalFilename: item.originalFilename,
    }));
    return entries;
}