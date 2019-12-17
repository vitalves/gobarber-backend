import { Router } from 'express';
// const { Router } = require("express");

// para o apload
import multer from 'multer';
import multerConfig from './config/multer';

// import para o teste:
// import User from './app/models/Users';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import ProviderController from './app/controllers/ProviderController';
import AppointmentController from './app/controllers/AppointmentController';
import ScheduleController from './app/controllers/ScheduleController';
import NotificationController from './app/controllers/NotificationController';
import AvailableController from './app/controllers/AvailableController';

// middleware
import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

/* rota pra teste:
routes.get('/', async (req, res) => {
  const user = await User.create({
    name: 'Diego Ferna',
    email: 'diego2@diego.com',
    password_hash: '1231231321',
  });

  return res.json(user);
}); */

// VARIAVEIS:
routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

// usar middleware para evitar que essa rota seja acessada sem autenticacao
/*
OBS: o middleware pode ser usado localmente dentro da rota. EX:
routes.put('/users', authMiddleware, UserController.update)
*/
// Middleware GLOBAL:
routes.use(authMiddleware); // so vai valer p/ as rotas que vem apos ele
// rotas para baixo exigem autenticacao 'Bearer Authentication token'
routes.put('/users', authMiddleware, UserController.update);

// rota para upload
routes.post('/files', upload.single('file'), FileController.store);

// rotas para providers
routes.get('/providers', ProviderController.index); // lista
routes.get('/providers/:providerId/available', AvailableController.index); // horarios disponiveis

// rota para Appointments
routes.get('/appointments', AppointmentController.index); // lista
routes.post('/appointments', AppointmentController.store); // cadastra
routes.delete('/appointments/:id', AppointmentController.delete); // Apaga

// Agendamento de servicos (prestador de servico)
routes.get('/schedule', ScheduleController.index);

// Notificacoes
routes.get('/notifications', NotificationController.index); // lista
routes.put('/notifications/:id', NotificationController.update); // marca como lido

/* antes do sucrase:
module.exports = routes; */
export default routes;
