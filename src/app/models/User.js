import Sequelize, { Model } from 'sequelize';

// para a criptografia
import bcrypt from 'bcryptjs';

class User extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        password: Sequelize.VIRTUAL,
        password_hash: Sequelize.STRING,
        provider: Sequelize.BOOLEAN,
      },
      {
        sequelize,
      }
    );

    // hook sao trechos de codigos executados de forma automatica baseada em acoes
    this.addHook('beforeSave', async user => {
      // ex: user.name = 'Diego'; // todo usuario receberia esse nome
      if (user.password) {
        user.password_hash = await bcrypt.hash(user.password, 8);
      }
    });

    // retorna o modulo que acabou de ser inicializado
    return this;
  }

  // Associar tabelas
  static associate(models) {
    // this.hasOne(...) // tem um
    this.belongsTo(models.File, { foreignKey: 'avatar_id', as: 'avatar' }); // pertence ao
  }

  // metodo para a verificacao de senha
  checkPassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }
}

export default User;
