// importa o modulo para datas:
import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
// importa a classe de envio de email:
import Mail from '../../lib/Mail';

class CancellationMail {
  get key() {
    return 'CancellationMail'; // chave unica (para cada job um chave unica)
  }

  // tarefa que vai executar quando o processo for executado
  async handle({ data }) {
    // no 'data' vai estar todas as info que vai chegar para o envio de email
    const { appointment } = data;

    // console.log('A fila executou');

    //  DADOS DO ENVIO DO EMAIL DE CANCELAMENTO DE AGENDAMENTO (AppointmentController)
    await Mail.sendMail({
      to: `${appointment.provider.name} <${appointment.provider.email}>`,
      subject: 'Agendamento cancelado',
      // text: 'atenção! Você tem um novo cancelamento!?', // MODO S/ TEMPLATE
      // Inclui template no email:
      template: 'cancellation', // sem a extensao
      // variaves enviadas ao template:
      context: {
        provider: appointment.provider.name,
        user: appointment.user.name,
        date: format(
          parseISO(appointment.date),
          "'dia' dd 'de' MMMM', as' H:mm'h'",
          {
            locale: pt,
          }
        ),
      },
    });
  }
}

export default new CancellationMail();
