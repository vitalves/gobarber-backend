import Sequelize, { Model } from 'sequelize';
// importa o date-fns para trabalha com a data no campo virtual 'PAST'
import { isBefore, subHours } from 'date-fns';

class Appointment extends Model {
  static init(sequelize) {
    super.init(
      {
        date: Sequelize.DATE,
        canceled_at: Sequelize.DATE,
        // DADOS ADICIONAIS: (VIRTUAL :: nao esta no DB)
        // retorna True se o horario ja passou e False para o contrario
        past: {
          type: Sequelize.VIRTUAL,
          get() {
            return isBefore(this.date, new Date()); // true ou Flase
          },
        },
        // Informa se o agendamento ainda esta no prazo que possa ser cancelado
        cancelable: {
          type: Sequelize.VIRTUAL,
          get() {
            // verifica a hora atual esta ha mais de 2h antes da data agendada
            return isBefore(new Date(), subHours(this.date, 2)); // true ou Flase
          },
        },
      },
      {
        sequelize,
      }
    );
    // retorn o modulo que acabou de ser inicializado
    return this; // essencial para o relacionamento entre tabelas
  }

  static associate(models) {
    // Dois relacionamentos com a mesma tabela (exige o uso do "as:")
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    this.belongsTo(models.User, { foreignKey: 'provider_id', as: 'provider' });
  }
}

export default Appointment;
