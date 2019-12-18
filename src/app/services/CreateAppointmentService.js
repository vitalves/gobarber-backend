import { startOfHour, parseISO, isBefore, format } from 'date-fns';
import pt from 'date-fns/locale/pt';

import User from '../models/User';
import Appointment from '../models/Appointment';

import Notification from '../schemas/Notification';

import Cache from '../../lib/Cache';

class CreateAppointmentService {
  async run({ provider_id, user_id, date }) {
    // verifica se o usuario tenat agendar com ele mesmo
    if (provider_id === user_id) {
      throw new Error('Nao e possivel agendar com si mesmo');
    }

    // verifica se o provider_is é um provedor de serviços
    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider) {
      throw new Error('voce nao pode marcar esse servico');
    }

    // VERIFICACOES DE DATA E HORA:

    // pega a hora sem mins e segs
    const hourStart = startOfHour(parseISO(date));

    // verifica se a data passada é anterior a atual
    if (isBefore(hourStart, new Date())) {
      throw new Error('Data anterior nao permitida');
    }

    // verifica se a dada esta disponivel
    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (checkAvailability) {
      throw new Error('Data nao disponivel');
    }
    // FIM VERIFICACOES DE DATA E HORA

    // Criar no banco de dados
    const appointment = await Appointment.create({
      user_id, // userId é setado no middleware de autenticacao
      provider_id,
      date,
    });

    // NOTIFICAR AGENDAMENTO (Usando os Schemas do Mongoose/Mongo)
    // Busca no BD o usuario
    const user = await User.findByPk(user_id);
    // Forma a data
    const formattedDate = format(
      hourStart,
      "'dia' dd 'de' MMMM', as' H:mm'h'",
      { locale: pt }
    );

    await Notification.create({
      content: `Novo agendamento de ${user.name} para ${formattedDate}`,
      user: provider_id,
      // read: nao precisa por tem padrao de FALSE
    });
    // FIM NOTIFICAR AGENDAMENTO (Usando os Schemas do Mongoose/Mongo)

    // invalidar cache:
    await Cache.invalidatePrefix(`user:${user.id}:appointments`);

    return appointment;
  }
}

export default new CreateAppointmentService();
