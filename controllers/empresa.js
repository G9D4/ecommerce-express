exports.getNosotros = async (req, res, next) => {
    try {
        res.render("empresa/nosotros", {
            titulo: "Conócenos",
            path: "/nosotros"
        });
    } catch (error) {
        console.log(error);
    }
};

exports.getSoporte = async (req, res, next) => {
    try {
        res.render("empresa/faqs", {
            titulo: "Soporte Técnico",
            path: "/faqs"
        });
    } catch (error) {
        console.log(error);
    }
};

exports.getCondicionesCompra = async (req, res, next) => {
    try {
        res.render("empresa/condiciones-compra", {
            titulo: "Términos y Condiciones",
            path: "/condiciones-compra"
        });
    } catch (error) {
        console.log(error);
    }
};