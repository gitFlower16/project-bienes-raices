import { unlink } from "node:fs/promises";
import { validationResult } from "express-validator	";
import { Precio, Categoria, Propiedad, Mensaje} from "../models/index.js";
import { esVendedor } from "../helpers/index.js";

const admin = async (req, res) => {
  //QueryStrings
  const { pagina: paginaActual } = req.query;
  const numeracion = /^[0-9]$/;

  if (!numeracion.test(paginaActual)) {
    return res.redirect("/mis-propiedades?pagina=1");
  }

  try {
    const { id } = req.usuario;
    //Limites de paginación
    const limit = 10;
    const offset = paginaActual * limit - limit;

    const [propiedades, total] = await Promise.all([
      Propiedad.findAll({
        limit,
        offset,
        where: {
          usuario_id: id,
        },
        include: [
          { model: Categoria, as: "categoria" },
          { model: Precio, as: "precio" },
          { model:Mensaje, as:"mensajes"}
        ],
      }),
      Propiedad.count({
        where: {
            usuario_id: id
        }
      })
    ])
    console.log(total)

    res.render("propiedades/admin", {
      pagina: "Mis propiedades",
      propiedades,
      csrfToken: req.csrfToken(),
      paginas: Math.ceil(total/limit),
      paginaActual:Number(paginaActual),
      total,
      offset,
      limit
    });
  } catch (error) {
    console.log(error);
  }
};

const crear = async (req, res) => {
  //Consultar modelo de precio y categoría
  const [categorias, precios] = await Promise.all([
    Categoria.findAll(),
    Precio.findAll(),
  ]);

  res.render("propiedades/crear", {
    pagina: "Crear propiedad",
    csrfToken: req.csrfToken(),
    categorias,
    precios,
    datos: {},
  });
};

const guardar = async (req, res) => {
  //Validación
  let resultado = validationResult(req);
  if (!resultado.isEmpty()) {
    const [categorias, precios] = await Promise.all([
      Categoria.findAll(),
      Precio.findAll(),
    ]);

    return res.render("propiedades/crear", {
      pagina: "Crear propiedad",
      csrfToken: req.csrfToken(),
      categorias,
      precios,
      errores: resultado.array(),
      datos: req.body,
    });
  }

  //Crear un registro
  const {
    titulo,
    descripcion,
    habitaciones,
    estacionamiento,
    wc,
    calle,
    lat,
    lng,
    precio: precio_id,
    categoria: categoria_id,
  } = req.body;
  const { id: usuario_id } = req.usuario;
  try {
    const propiedadGuardada = await Propiedad.create({
      titulo,
      descripcion,
      habitaciones,
      estacionamiento,
      wc,
      calle,
      lat,
      lng,
      precio_id,
      categoria_id,
      usuario_id,
      imagen: "",
    });
    const { id } = propiedadGuardada;
    res.redirect(`/propiedades/agregar-imagen/${id}`);
  } catch (error) {
    console.log(error);
  }
};

const agregarImagen = async (req, res) => {
  //Leer el id
  const { id } = req.params;
  const propiedad = await Propiedad.findByPk(id);

  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }

  //Validar que la propiedad exista
  if (propiedad.publicado) {
    return res.redirect("/mis-propiedades");
  }

  if (req.usuario.id.toString() !== propiedad.usuario_id.toString()) {
    return res.redirect("/mis-propiedades");
  }

  res.render("propiedades/agregar-imagen", {
    pagina: `Agregar imagen: ${propiedad.titulo}`,
    csrfToken: req.csrfToken(),
    propiedad,
  });
};

const almacenarImagen = async (req, res, next) => {
  const { id } = req.params;
  const propiedad = await Propiedad.findByPk(id);
  //Si no existe la propiedad
  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }
  if (propiedad.publicado) {
    return res.redirect("/mis-propiedades");
  }
  //Ver que el usuario sea el mismo que ha agregado la propiedad
  if (req.usuario.id.toString() !== propiedad.usuario_id.toString()) {
    return res.redirect("/mis-propiedades");
  }

  try {
    //Almacenar la imagen y publicar propiedad
    console.log(req.file);
    propiedad.imagen = req.file.filename;
    propiedad.publicado = 1;

    //Guardar imagen
    await propiedad.save();

    next();
  } catch (error) {
    console.log(error);
  }
};

const editar = async (req, res) => {
  //Validar la propiedad
  const { id } = req.params;

  //Validar si la propiedad existe
  const propiedad = await Propiedad.findByPk(id);

  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }

  //Validar al usuario que solicita la edición de la propiedad
  if (propiedad.usuario_id.toString() !== req.usuario.id.toString()) {
    return res.redirect("/mis-propiedades");
  }

  const [categorias, precios] = await Promise.all([
    Categoria.findAll(),
    Precio.findAll(),
  ]);
  res.render("propiedades/editar-propiedad", {
    pagina: `Editar propiedad : ${propiedad.titulo} `,
    csrfToken: req.csrfToken(),
    categorias,
    precios,
    datos: propiedad,
  });
};
const guardarCambios = async (req, res) => {
  //Verificar la validación
  let resultado = validationResult(req);
  if (!resultado.isEmpty()) {
    const [categorias, precios] = await Promise.all([
      Categoria.findAll(),
      Precio.findAll(),
    ]);

    return res.render("propiedades/editar-propiedad", {
      pagina: "Editar propiedad",
      csrfToken: req.csrfToken(),
      categorias,
      precios,
      errores: resultado.array(),
      datos: req.body,
    });
  }
  const { id } = req.params;

  //Validar si la propiedad existe
  const propiedad = await Propiedad.findByPk(id);

  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }

  //Validar al usuario que solicita la edición de la propiedad
  if (propiedad.usuario_id.toString() != req.usuario.id.toString()) {
    return res.redirect("/mis-propiedades");
  }

  //Reescribir el objeto y actualizarlo
  try {
    const {
      titulo,
      descripcion,
      habitaciones,
      estacionamiento,
      wc,
      calle,
      lat,
      lng,
      precio: precio_id,
      categoria: categoria_id,
    } = req.body;
    propiedad.set({
      titulo,
      descripcion,
      habitaciones,
      estacionamiento,
      wc,
      calle,
      lat,
      lng,
      precio_id,
      categoria_id,
    });

    await propiedad.save();
    res.redirect("/mis-propiedades");
  } catch (error) {
    console.log(error);
  }
};
const eliminar = async (req, res) => {
  const { id } = req.params;

  //Validar si la propiedad existe
  const propiedad = await Propiedad.findByPk(id);

  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }

  //Validar al usuario que solicita la edición de la propiedad
  if (propiedad.usuario_id.toString() !== req.usuario.id.toString()) {
    return res.redirect("/mis-propiedades");
  }
  //Eliminar la imagen asociada
  await unlink(`public/uploads/${propiedad.imagen}`);
  console.log("Se eliminó la imagen");

  //Eliminar la propiedad
  await propiedad.destroy();
  res.redirect("/mis-propiedades");
};

//Modificar el estado de la propiedad
const cambiarEstado = async (req,res) =>{
  const { id } = req.params;

  //Validar si la propiedad existe
  const propiedad = await Propiedad.findByPk(id);

  if (!propiedad) {
    return res.redirect("/mis-propiedades");
  }
 
  //Validar al usuario que solicita la edición de la propiedad
  if (propiedad.usuario_id.toString() !== req.usuario.id.toString()) {
    return res.redirect("/mis-propiedades");
  }
  //Actualizar
  propiedad.publicado = !propiedad.publicado

  await propiedad.save()

  res.json({
    resultado: 'ok'
  })
}

//Mostrar una propiedad
const mostrarPropiedad = async (req, res) => {
  const { id } = req.params;
 
  //Comprobar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id, {
    include: [
      { model: Precio, as: "precio" },
      { model: Categoria, as: "categoria" },
    ],
  });

  if (!propiedad || !propiedad.publicado) {
    return res.redirect("/404");
  }
  
  res.render("propiedades/mostrar", {
    propiedad,
    pagina: propiedad.titulo,
    csrfToken: req.csrfToken(),
    usuario: req.usuario,
    esVendedor:esVendedor(req.usuario?.id,propiedad.usuario_id)
  });
};

const enviarMensaje = async (req,res)=>{
  const { id } = req.params;
 
  //Comprobar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id, {
    include: [
      { model: Precio, as: "precio" },
      { model: Categoria, as: "categoria" },
    ],
  });

  if (!propiedad) {
    return res.redirect("/404");
  }
  //Renderizar los errores 
  //Validación
  let resultado = validationResult(req);

  if (!resultado.isEmpty()) {
      return res.render("propiedades/mostrar", {
        propiedad,
        pagina: propiedad.titulo,
        csrfToken: req.csrfToken(),
        usuario: req.usuario,
        esVendedor:esVendedor(req.usuario?.id,propiedad.usuario_id),
        errores:resultado.array()
      })
  }
  //Extraer el mensaje
  const {mensaje} = req.body
  const {id:propiedad_id} = req.params
  const {id:usuario_id} = req.usuario
 
  //Almacenar el mensaje
  await Mensaje.create({
    mensaje,
    propiedad_id,
    usuario_id
})
  
  res.redirect('/')
}



export {
  admin,
  crear,
  guardar,
  agregarImagen,
  almacenarImagen,
  editar,
  guardarCambios,
  eliminar,
  cambiarEstado,
  mostrarPropiedad,
  enviarMensaje
};
