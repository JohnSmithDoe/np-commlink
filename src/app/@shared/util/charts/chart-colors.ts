interface ChartColors {
  income: string;
  spend: string;
  series: string[];
}

export function chartColors(): ChartColors {
  const css = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string): string =>
    css.getPropertyValue(name).trim() || fallback;

  const amber = read('--ion-color-primary', '#de8b27');
  const cyan = read('--ion-color-secondary', '#32aea6');
  const success = read('--ion-color-success', '#2d7c3e');
  const warning = read('--ion-color-warning', '#ffc409');
  const danger = read('--ion-color-danger', '#eb445a');

  return {
    income: success,
    spend: danger,
    series: [amber, cyan, success, warning, danger, '#7044ff', '#92949c'],
  };
}
