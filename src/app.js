// primeira importacao as variaveis de desenvolvimento
import 'dotenv/config'; // process.env
// framework express
import express from 'express';
// importa o path para trabalhar com caminhos dos arquivos
import path from 'path';
// restringir acessos a API:
import cors from 'cors';
// tratar os erros retornados
import Youch from 'youch';

// importa o SENTRY para tratamento de erros (antes das rotas):
import * as Sentry from '@sentry/node'; // importacao similar ao Yup

// Possibilitar tratar erros com o SENTRY mesmo usando ASYNC
import 'express-async-errors';

// importa as rotas
import routes from './routes';

// configs do SENTRY (tratamento de erros)
import sentryConfig from './config/sentry';

// importa o database
import './database';

/* Antes do sucrase:
const express = require("express");
const routes = require("./routes");
*/

class App {
  constructor() {
    this.server = express();

    // Tratamento de erro com o SENTRY
    Sentry.init(sentryConfig);
    // this.server.use(Sentry.Handlers.requestHandler()); // Movido pra dentro dos midlewares por preferencia

    this.middlewares();
    this.routes();

    // retornar/exibir erros em caso de falhas nas requisicoes
    this.exceptionHandler();
  }

  middlewares() {
    // Tratamento de erros com Sentry
    this.server.use(Sentry.Handlers.requestHandler()); // antes de tds as rotas

    // define endereços que podem acessar a API
    // this.server.use(cors({ origin: 'https://rocketseat.com.br' })); // em producao
    this.server.use(cors()); // em desenvolvimento

    this.server.use(express.json());
    // express.static: servir aquivos estaticos
    this.server.use(
      '/files',
      express.static(path.resolve(__dirname, '..', 'tmp', 'uploads'))
    );
  }

  routes() {
    // executa as rotas
    this.server.use(routes);

    // Tratamento de erro com Sentry
    this.server.use(Sentry.Handlers.errorHandler()); // Apos tds as rotas
  }

  // metodo para retornar eventuais erros nas requisicoes
  exceptionHandler() {
    // novo midleware (de tratamento de excecao => 1 paramentro eh err)
    this.server.use(async (err, req, res, next) => {
      // retornar erros APENAS em ambiente de desenvolvimento:
      if (process.env.NODE_ENV === 'development') {
        const errors = await new Youch(err, req).toJSON(); // ha tbm o toHTML

        return res.status(500).json(errors);
      }

      return res.status(500).json({ error: 'Internal Server Error' });
    });
  }
}

export default new App().server;
