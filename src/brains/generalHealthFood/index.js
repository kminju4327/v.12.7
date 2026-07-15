import { GENERAL_HEALTH_FOOD_BRAIN_V6, generalHealthFoodBrain } from './brain.js';
import { GENERAL_HEALTH_FOOD_TEMPLATE, generalHealthFoodTemplate } from './template.js';
import { GENERAL_HEALTH_FOOD_PROMPT, generalHealthFoodPrompt } from './prompt.js';
import { GENERAL_HEALTH_FOOD_VALIDATOR, generalHealthFoodValidator } from './validator.js';

export {
  GENERAL_HEALTH_FOOD_BRAIN_V6,
  GENERAL_HEALTH_FOOD_TEMPLATE,
  GENERAL_HEALTH_FOOD_PROMPT,
  GENERAL_HEALTH_FOOD_VALIDATOR,
  generalHealthFoodBrain,
  generalHealthFoodTemplate,
  generalHealthFoodPrompt,
  generalHealthFoodValidator,
};

export const generalHealthFoodSystem = {
  id: 'generalHealthFood',
  name: '일반 건강식품 V6',
  brain: GENERAL_HEALTH_FOOD_BRAIN_V6,
  template: GENERAL_HEALTH_FOOD_TEMPLATE,
  prompt: GENERAL_HEALTH_FOOD_PROMPT,
  validator: GENERAL_HEALTH_FOOD_VALIDATOR,
};
