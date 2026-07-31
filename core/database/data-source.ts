import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './typeorm.options';

export default new DataSource(buildDataSourceOptions());
