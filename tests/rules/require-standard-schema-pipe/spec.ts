import rule, { RULE_NAME } from '../../../src/rules/require-standard-schema-pipe.js';
import { createRuleTester } from '../../test-utils.js';
import { invalid, valid } from './cases.js';

createRuleTester().run(RULE_NAME, rule, { valid, invalid });
