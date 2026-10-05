import blankLines from './blank-lines.js';
import classMemberOrder from './class-member-order.js';
import commentStyle from './comment-style.js';
import decoratorOrder from './decorator-order.js';
import fileSuffix from './file-suffix.js';
import maxCommentLines from './max-comment-lines.js';
import maxDependencies from './max-dependencies.js';
import maxParams from './max-params.js';
import maxPublicMethods from './max-public-methods.js';
import noCommentedOutCode from './no-commented-out-code.js';
import noCommentSemicolon from './no-comment-semicolon.js';
import noFillerComments from './no-filler-comments.js';
import noLlmArtifacts from './no-llm-artifacts.js';
import noNewService from './no-new-service.js';
import noRestatingComment from './no-restating-comment.js';
import noRestatingJsdoc from './no-restating-jsdoc.js';
import noStraySemicolon from './no-stray-semicolon.js';
import noUntranslatedText from './no-untranslated-text.js';
import oneLineGuard from './one-line-guard.js';
import preferHttpResource from './prefer-http-resource.js';
import preferMutation from './prefer-mutation.js';
import preferQueryMethod from './prefer-query-method.js';
import preferServiceDecorator from './prefer-service-decorator.js';
import requireBodySchema from './require-body-schema.js';
import requireStandardSchemaPipe from './require-standard-schema-pipe.js';

export const rules = {
  'blank-lines': blankLines,
  'class-member-order': classMemberOrder,
  'comment-style': commentStyle,
  'decorator-order': decoratorOrder,
  'file-suffix': fileSuffix,
  'max-comment-lines': maxCommentLines,
  'max-dependencies': maxDependencies,
  'max-params': maxParams,
  'max-public-methods': maxPublicMethods,
  'no-commented-out-code': noCommentedOutCode,
  'no-comment-semicolon': noCommentSemicolon,
  'no-filler-comments': noFillerComments,
  'no-llm-artifacts': noLlmArtifacts,
  'no-new-service': noNewService,
  'no-restating-comment': noRestatingComment,
  'no-restating-jsdoc': noRestatingJsdoc,
  'no-stray-semicolon': noStraySemicolon,
  'no-untranslated-text': noUntranslatedText,
  'one-line-guard': oneLineGuard,
  'prefer-http-resource': preferHttpResource,
  'prefer-mutation': preferMutation,
  'prefer-query-method': preferQueryMethod,
  'prefer-service-decorator': preferServiceDecorator,
  'require-body-schema': requireBodySchema,
  'require-standard-schema-pipe': requireStandardSchemaPipe,
};
