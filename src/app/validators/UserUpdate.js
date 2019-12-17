import * as Yup from 'yup';

export default async (req, res, next) => {
  try {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      oldPassword: Yup.string().min(6),
      password: Yup.string()
        .min(6)
        .when('oldPassword', (oldPassword, fild) =>
          oldPassword ? fild.required() : fild
        ), // WHEN = validacao condicional
      // o valor da senha de confirmacao deve ser igual ao campo senha
      confirmPassword: Yup.string().when('password', (password, fild) =>
        password ? fild.required().oneOf([Yup.ref('password')]) : fild
      ),
    });

    await schema.validate(req.body, { abortEarly: false });

    return next();
  } catch (err) {
    return res
      .status(400)
      .json({ error: 'Falha da validacao', messages: err.inner }); // erros
  }
};
