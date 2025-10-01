export default function getAbbreviatedPrice(price: number) {
    return Math.abs(price) > 10000 ? price.toFixed(0) : price.toFixed(2);
}
