import nodemailer from 'nodemailer'
const emailRegistro = async(datos) => {
    const transport = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
            }
      });  
      const{email,nombre ,token} = datos

      //Enviar email
      await transport.sendMail({
        from: 'BienesRaices.com',
        to: email,
        subject: 'Confirmación de cuenta',
        text: 'Por favor, confirma tu cuenta en BienesRaices',
        html: `
                <p> Hola ${nombre}, comprueba tu cuenta en bienesRaices.com </p>
                
                <p> Tu cuenta ya está lista, solo debes confirmarla en el siguiente enlace: <a
                href = "${process.env.BACKEND_URL}:${process.env.PORT ?? 4000}/auth/confirmar/${token}">Confirmar cuenta </a> </p>
                
                <p>Si la cuenta no es tuya, puedes ignorar este mensaje </p>`
      })

}

const emailOlvideContraseña = async(datos) => {
    const transport = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
            }
      });  
      const{email,nombre ,token} = datos

      //Enviar email
      await transport.sendMail({
        from: 'BienesRaices.com',
        to: email,
        subject: 'Reestablecer contraseña',
        text: 'Restablece tu cuenta en BinesRaices.com',
        html: `
                <p> Hola ${nombre}, has solicitado reestablecer tu cuenta en bienesRaices.com </p>
                
                <p> Sigue el siguiente enlace para generar una nueva contraseña <a
                href = "${process.env.BACKEND_URL}:${process.env.PORT ?? 4000}/auth/olvide-password/${token}">Reestablecer contraseña</a> </p>
                
                <p>Si no solicitaste la actualización de tu contraseña, puedes ignorar este mensaje </p>`
      })

}

export {
    emailRegistro,
    emailOlvideContraseña
}