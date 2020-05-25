(function() {
  const selectedCart = [
    { price: 20 },
    { price: 45 },
    { price: 67 },
    { price: 1305 }
  ];

  const validCurrencyNamesHashMap = {
    'rubles': 'RUB',
    'euros': 'EUR',
    'US dollars': 'USD',
    'pounds': 'GBP',
    'yens': 'JPY'
  };

  const maybeList = function(list) {
    return Array.isArray(list) ? list : [];
  };
  const maybeHash = function(hash) {
    return (typeof hash === 'object' && !Array.isArray(hash) && hash !== null) ? hash : {};
  };
  const maybeNumber = function(number) {
    return typeof number === 'number' ? number : 0;
  };
  const maybeHashList = function(list) {
    return maybeList(list).map(maybeHash);
  };
  const maybeCurrency = function(string) {
    return typeof string === 'string' ? string : 'USD';
  };
  const maybeCartList = function(list) {
    return maybeHashList(list).map((item) => ({ price: maybeNumber(item.price) }));
  };

  const TotalCartPriceObject = function(initialPrice, initialCurrency) {
    this._value = maybeNumber(initialPrice);
    this._currency = maybeCurrency(initialCurrency);
  };
  TotalCartPriceObject.prototype = {
    _requestCurrenciesHash: function() {
      return fetch(`https://api.exchangeratesapi.io/latest?base=${this._currency}`)
        .then(response => response.json())
        .then(json => maybeHash(json.rates))
        .catch(() => {});
    },
    recalculateTotalPriceObject: function(cartList) {
      const sum = cartList.map((item) => item.price).reduce((price1, price2) => price1 + price2);

      return TotalCartPriceObject.create(sum, this._currency);
    },
    getCurrenciesPriceHash: function(validCurrencyNamesHashMap) {
      return this._requestCurrenciesHash().then((requestedCurrenciesHash) => {
        const priceHash = {};

        Object.keys(validCurrencyNamesHashMap).forEach((key) => {
          const currencyName = validCurrencyNamesHashMap[key];
          const currencyValue = maybeNumber(requestedCurrenciesHash[currencyName]) * this._value;

          priceHash[key] = Number(currencyValue.toFixed(2));
        });

        return priceHash;
      });
    }
  };
  TotalCartPriceObject.create = function(initialPrice, initialCurrency) {
    return new TotalCartPriceObject(initialPrice, initialCurrency);
  }

  // HTML elements
  const marketCartElement = document.querySelector('.market-cart');
  const calculateButton = document.querySelector('.calculate-button');
  const hashPrintElement = document.querySelector('.hash-print');
  const setElementDisable = function(element, disabled) {
    element.disabled = !!disabled;
  }

  // Program logic
  const validSelectedCart = maybeCartList(selectedCart);
  const marketCartPriceObject = TotalCartPriceObject.create().recalculateTotalPriceObject(validSelectedCart);

  marketCartElement.textContent = 'Выбраны товары стоимостью: ' + validSelectedCart.map(item => item.price).join(', ');

  calculateButton.addEventListener('click', function(e) {
    setElementDisable(e.target, true); // disable other requests until current result will be done

    marketCartPriceObject.getCurrenciesPriceHash(validCurrencyNamesHashMap).then((priceHash) => {
      hashPrintElement.textContent = JSON.stringify(priceHash, undefined, 2);
      setElementDisable(e.target);
    });
  });
})();
