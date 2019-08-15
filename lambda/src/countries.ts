export const countries = {
  usb: { id: 49155, name: "United States of Balloons" },
  usa: { id: 49156, name: "United States of Ambrosia" }
};

export const countriesById = Object.entries(countries)
  .map(([k, v]) => ({ id: v.id, value: k }))
  .reduce(
    (prev, current) => {
      prev[current.id] = current.value;
      return prev;
    },
    {} as {
      [id: number]: string;
    }
  );
