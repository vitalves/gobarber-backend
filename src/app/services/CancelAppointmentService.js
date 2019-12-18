import { isBefore, subHours } from 'date-fns';

import User from '../models/User';
import Appointment from '../models/Appointment';

import Queue from '../../lib/Queue';
import Cache from '../../lib/Cache';

import CancellationMail from '../jobs/CancellationMail';

class CancelAppointmentService {
  async run({ provider_id, user_id }) {
    // buscar os dados do agendamento (include no User provider para o envio de email)
    const appointment = await Appointment.findByPk(provider_id, {
      include: [
        // usuario prestador de servico:
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        // usuario comum para enviar o nome no email:
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });

    // verifica se o usuario logado e 'dono' do agendamento
    if (appointment.user_id !== user_id) {
      throw new Error('Você não tem permissao para cancelar esse agendamento');
    }

    // subHours - Subtrai horas
    const dateWithSub = subHours(appointment.date, 2); // subtrai 2h da data agendada

    // verifica se a hora subtraida eh anterior a hora atual
    if (isBefore(dateWithSub, new Date())) {
      throw new Error(
        'Voce so pode cancelar agendamentos com mais de 2 horas de antecedecia'
      );
    }

    // Se OK: Insere a data atual no campo 'canceled_at'
    appointment.canceled_at = new Date();

    // salva no banco a agendamento completo com a alteracao
    await appointment.save();

    // envia um email ao pretador de servco (ENVIA PARA A FILA - Queue -):
    await Queue.add(CancellationMail.key, {
      // dados do email:
      appointment,
      // teste: 'teste'
    });

    // invalidar cache:
    await Cache.invalidatePrefix(`user:${user_id}:appointments`);

    return appointment;
  }
}

export default new CancelAppointmentService();
