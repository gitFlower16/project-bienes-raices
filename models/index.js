import Propiedad from "./Propiedad.js"
import Categoria from "./Categoria.js"
import Precio from "./Precio.js"
import Usuario from "./Usuario.js"
import Mensaje from "./Mensaje.js"

Propiedad.belongsTo(Precio, {foreignKey: 'precio_id'})
Propiedad.belongsTo(Categoria, {foreignKey: 'categoria_id'})
Propiedad.belongsTo(Usuario, {foreignKey:'usuario_id'})
Propiedad.hasMany(Mensaje,{foreignKey:'propiedad_id'})
Mensaje.belongsTo(Propiedad,{foreignKey:'propiedad_id'})
Mensaje.belongsTo(Usuario,{foreignKey:'usuario_id'})


export {
    Propiedad,
    Categoria,
    Precio,
    Usuario,
    Mensaje
}