const Sequelize = require('sequelize');
const pg = require("pg");
var sequelize = new Sequelize('senecadb', 'senecadb_owner', 'jzCF2k7eqLlH', {
    host: 'ep-old-wildflower-a5i9a0jr.us-east-2.aws.neon.tech',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

const Item = sequelize.define('Item', {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    itemDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN,
    price: Sequelize.DOUBLE
});

const Category = sequelize.define('Category', {
    category: Sequelize.STRING
});

Item.belongsTo(Category, { foreignKey: 'category' });

function initialize() {
    return new Promise((resolve, reject) => {
        sequelize.sync()
            .then(() => resolve())
            .catch(err => reject("unable to sync the database"));
    });
}

function getAllItems() {
    return new Promise((resolve, reject) => {
        Item.findAll()
            .then(data => resolve(data))
            .catch(err => reject("no results returned"));
    });
}

function getItemsByCategory(category) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: { category: category }
        })
            .then(data => resolve(data))
            .catch(err => reject("no results returned"));
    });
}

function getItemsByMinDate(minDateStr) {
    const { gte } = Sequelize.Op;
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                itemDate: {
                    [gte]: new Date(minDateStr)
                }
            }
        })
            .then(data => resolve(data))
            .catch(err => reject("no results returned"));
    });
}

function getItemById(id) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: { id: id }
        })
            .then(data => resolve(data[0]))
            .catch(err => reject("no results returned"));
    });
}

function addItem(itemData) {
    itemData.published = (itemData.published) ? true : false;
    for (const prop in itemData) {
        if (itemData[prop] === "") itemData[prop] = null;
    }
    itemData.itemDate = new Date();

    return new Promise((resolve, reject) => {
        Item.create(itemData)
            .then(() => resolve())
            .catch(err => reject("unable to create item"));
    });
}

function getPublishedItems() {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: { published: true }
        })
            .then(data => resolve(data))
            .catch(err => reject("no results returned"));
    });
}

function getPublishedItemsByCategory(category) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                published: true,
                category: category
            }
        })
            .then(data => resolve(data))
            .catch(err => reject("no results returned"));
    });
}

function getCategories() {
    return new Promise((resolve, reject) => {
        Category.findAll()
            .then(data => resolve(data))
            .catch(err => reject("no results returned"));
    });
}

function addCategory(categoryData) {
    for (const prop in categoryData) {
        if (categoryData[prop] === "") categoryData[prop] = null;
    }
    return new Promise((resolve, reject) => {
        Category.create(categoryData)
            .then(() => resolve())
            .catch(err => reject("unable to create category"));
    });
}

function deleteCategoryById(id) {
    return new Promise((resolve, reject) => {
        Category.destroy({
            where: { id: id }
        })
            .then(() => resolve())
            .catch(err => reject("unable to delete category"));
    });
}

function deleteItemById(id) {
    return new Promise((resolve, reject) => {
        Item.destroy({
            where: { id: id }
        })
            .then(() => resolve())
            .catch(err => reject("unable to delete item"));
    });
}

module.exports = {
    initialize,
    getAllItems,
    getItemsByCategory,
    getItemsByMinDate,
    getItemById,
    addItem,
    getPublishedItems,
    getPublishedItemsByCategory,
    getCategories,
    addCategory,
    deleteCategoryById,
    deleteItemById
};
