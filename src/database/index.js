/* AQUIVO QUE faz a conexao com o DB e correga os Models */
import Sequelize from 'sequelize'; // POSTGRESS DB
import mongoose from 'mongoose'; // MONGO DB

// importa os Models
import User from '../app/models/User';
import File from '../app/models/File';
import Appointment from '../app/models/Appointment';

// importa as configuracoes do DB
import databaseConfig from '../config/database';

// Array com os models da aplicacao
const models = [User, File, Appointment];

class Database {
  constructor() {
    this.init(); // POSTGRESS COM SEQUELIZE
    this.mongo(); // MONGO COM MONGOOSE
  }

  // BANCO POSTGRESS com Sequelize
  init() {
    // faz a conexao com o bd e carrega os models
    this.connection = new Sequelize(databaseConfig);

    // percorre o array e acessa os metodos (init)
    models
      .map(model => model.init(this.connection))
      .map(model => model.associate && model.associate(this.connection.models));
  }

  // BANCO MONGO com mongoose
  mongo() {
    this.mongoConnection = mongoose.connect(
      // url de conexao do Mongo
      process.env.MONGO_URL, // mongo cria a base de dados
      {
        useNewUrlParser: true,
        useFindAndModify: true,
        useUnifiedTopology: true,
      } // configs
    );
  }
}

export default new Database();
