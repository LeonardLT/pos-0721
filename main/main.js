'use strict';
let _ = require("lodash");
let {loadAllItems, loadPromotions} = require("../test/fixtures");
//#1
function formatTags(tags) {
    return _.map(tags, (tag) => {
        if (_.includes(tag, "-")) {
            let [barcode,count] = _.split(tag, "-");
            return {barcode, count: parseFloat(count)};
        } else {
            return {barcode: tag, count: 1};
        }
    });
}

//#2
function _getExistElementById(array, barcode) {
    return _.find(array, element => element.barcode === barcode);
}
function countBarcodes(formattedTags) {
    return _.reduce(formattedTags, (result, formattedTag) => {
        let found = _getExistElementById(result, formattedTag.barcode);
        if (found) {
            found.count += formattedTag.count;
        } else {
            result.push(formattedTag);
        }
        return result;
    }, []);
}

//#3
function buildCartItems(countedBarcodes, allItems) {
    return _.map(countedBarcodes, ({barcode, count}) => {
        let {name, unit, price} = _getExistElementById(allItems, barcode);
        return {barcode, name, unit, price, count}
    });
}

//#4
function buildPromotedItems(cartItems, promotions) {
    let currentPromotion = _.find(promotions, promotion => promotion.type === '单品批发价出售');
    return _.map(cartItems, (cartItem) => {
        let hasPromoted = _.includes(currentPromotion.barcodes, cartItem.barcode) && cartItem.count > 10;
        let totalPayPrice = cartItem.price * cartItem.count;
        let saved = hasPromoted ? totalPayPrice * 0.05 : 0;
        let payPrice = totalPayPrice - saved;
        return _.assign({}, cartItem, {payPrice, saved: parseFloat(saved.toFixed(2))});
    });
}

//#5
function calculateTotalPrices(promotedItems) {
    return {
        totalPayPrice: _.sumBy(promotedItems, 'payPrice'),
        totalSaved: _.sumBy(promotedItems, 'saved')
    };
}

//#6
function buildReceipt(promotedItems, {totalPayPrice, totalSaved}) {
    let savedItems = _.filter(promotedItems, promotedItem => promotedItem.saved > 0)
        .map(({name, unit, count}) => {
            return {name, unit, count};
        });
    return {
        promotedItems: _.map(promotedItems, ({name, unit, price, count, payPrice, saved}) => {
            return {name, unit, price, count, payPrice, saved};
        }),
        savedItems,
        totalPayPrice,
        totalSaved
    };
}

//#7
function buildReceiptString(receipt) {
    let lines = ['***<没钱赚商店>购物清单***'];
    let line = _.map(receipt.promotedItems, ({name, count, unit, price, payPrice, saved}) => {
        if (saved > 0) {
            return `名称：${name}，数量：${count}${unit}，单价：${price.toFixed(2)}(元)，小计：${payPrice.toFixed(2)}(元)，优惠：${saved.toFixed(2)}(元)`;
        } else {
            return `名称：${name}，数量：${count}${unit}，单价：${price.toFixed(2)}(元)，小计：${payPrice.toFixed(2)}(元)`;
        }
    });
    lines = _.concat(lines, line);
    let hasSaved = receipt.savedItems.length > 0;
    if (hasSaved) {
        for (let {name, count, unit} of receipt.savedItems) {
            lines.push(`----------------------`);
            lines.push(`批发价出售商品：`);
            lines.push(`名称：${name}，数量：${count}${unit}`);
        }

    }
    lines.push(`----------------------`);
    lines.push(`总计：${receipt.totalPayPrice.toFixed(2)}(元)`);
    if (hasSaved) {
        lines.push(`节省：${receipt.totalSaved}(元)`);
    }
    lines.push(`**********************`);

    return lines.join('\n');
}


function printReceipt(tags) {
    let allItems = loadAllItems();
    let promotions = loadPromotions();
    let formattedTags = formatTags(tags);
    let countedBarcodes = countBarcodes(formattedTags);
    let cartItems = buildCartItems(countedBarcodes, allItems);
    let promotedItems = buildPromotedItems(cartItems, promotions);
    let totalPrices = calculateTotalPrices(promotedItems);
    let receipt = buildReceipt(promotedItems, totalPrices);
    let receiptString = buildReceiptString(receipt);
    console.log(receiptString);


}


module.exports = {
    formatTags,
    countBarcodes,
    buildCartItems,
    buildPromotedItems,
    calculateTotalPrices,
    buildReceipt,
    buildReceiptString,
    printReceipt
};