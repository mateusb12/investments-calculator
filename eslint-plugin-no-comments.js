function removeLineAndBlockComments(context, comments) {
  return comments.map((comment) =>
    context.report({
      node: comment,
      messageId: 'noComment',
      fix: (fixer) => fixer.removeRange(comment.range),
    })
  );
}

function shouldRemoveJsxCommentContainer(node) {
  return (
    node.expression &&
    node.expression.type === 'JSXEmptyExpression' &&
    Array.isArray(node.expression.comments) &&
    node.expression.comments.length > 0
  );
}

function removeJsxCommentContainer(context, node) {
  context.report({
    node,
    messageId: 'noComment',
    fix: (fixer) => fixer.remove(node),
  });
}

function createRule(context) {
  const source = context.getSourceCode();
  const comments = source.getAllComments();

  removeLineAndBlockComments(context, comments);

  return {
    JSXExpressionContainer(node) {
      if (shouldRemoveJsxCommentContainer(node)) {
        removeJsxCommentContainer(context, node);
      }
    },
  };
}

export default {
  rules: {
    'no-explanatory-comments': {
      meta: {
        type: 'suggestion',
        fixable: 'code',
        docs: { description: 'Remove all comments' },
        messages: { noComment: 'CMT001 Do not commit comments' },
      },
      create: createRule,
    },
  },
};
