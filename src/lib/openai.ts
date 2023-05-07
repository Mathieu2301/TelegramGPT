import { Configuration, OpenAIApi } from 'openai';
import config from '../config';

const configuration = new Configuration({
  apiKey: config.openai.key,
});

const openai = new OpenAIApi(configuration);

export default openai;
