const priceFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency', currency: 'RUB', maximumFractionDigits: 2, minimumFractionDigits: 0,
});

export function priceLabel(value) {
  return Number(value) === 0 ? 'Бесплатно' : priceFormatter.format(value);
}

export function serviceCount(count) {
  const forms = { one: 'услуга', few: 'услуги', many: 'услуг', other: 'услуги' };
  return `${count} ${forms[new Intl.PluralRules('ru').select(count)]}`;
}

export function errorMessage(error) {
  switch (error?.status) {
    case 400: return 'Проверьте введённые данные.';
    case 403: return 'Доступ запрещён. Проверьте, что вы вошли как сотрудник.';
    case 404: return 'Запись не найдена или больше недоступна.';
    case 409: return error.message;
    case 429: return 'Слишком много попыток. Повторите запрос чуть позже.';
    default: return error?.status >= 500
      ? 'Ошибка на сервере. Попробуйте ещё раз.'
      : 'Не удалось связаться с сервером. Проверьте подключение.';
  }
}
