import rule, { RULE_NAME } from '../../../src/rules/class-member-order.js';
import { createRuleTester } from '../../test-utils.js';
import { invalid, valid } from './cases.js';

createRuleTester().run(RULE_NAME, rule, { valid, invalid });
