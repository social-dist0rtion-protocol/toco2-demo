import Web3 from "web3";
import { helpers, ExtendedWeb3, Unspent } from "leap-core";
import { playersAddresses } from "./players";
import { countriesById } from "./countries";

const web3URL = "https://testnet-node.leapdao.org";
let web3: ExtendedWeb3;

type Passport = {
  address: string;
  country: string;
  co2: number;
  trees: number;
};

const parseTrees = (data: string) =>
  Web3.utils.hexToNumber(`0x${data.substring(50, 58)}`);

const parseCO2 = (data: string) =>
  Web3.utils.hexToNumber(`0x${data.substring(58, 66)}`);

const sumByCountry = (passports: Passport[], field: "co2" | "trees") =>
  passports.reduce(
    (prev, current) => {
      prev[current.country] = (prev[current.country] || 0) + current[field];
      return prev;
    },
    {} as { [countryId: string]: number }
  );

const getLeaderboard = async () => {
  const promises: Array<{
    id: string;
    task: Promise<Unspent[]>;
    value?: Unspent[];
  }> = playersAddresses.map(p => ({
    id: p,
    task: web3.getUnspent(p),
    value: []
  }));

  console.log(`Getting passports for ${playersAddresses.length} player(s)...`);

  for (const promise of promises) {
    try {
      promise.value = await promise.task;
    } catch (error) {
      console.error(`error while fetching unspent of ${promise.id}: ${error}`);
      promise.value = [];
    }
  }

  const passports = promises
    .filter(p => p.value)
    .map(p =>
      p
        .value!.map(u => u.output)
        .filter(o => countriesById[o.color])
        .map(o => ({
          address: o.value,
          country: countriesById[o.color],
          co2: parseCO2(o.data!),
          trees: parseTrees(o.data!)
        }))
    )
    .reduce(
      (prev, current) => {
        prev.push(...current);
        return prev;
      },
      [] as Passport[]
    );

  console.log(`passports retrieved: ${passports.length}`);

  const emissionsByCountry = sumByCountry(passports, "co2");
  const treesByCountry = sumByCountry(passports, "trees");

  const trees = passports
    .filter(p => p.trees > 0)
    .sort((p1, p2) =>
      p1.trees > p2.trees ? -1 : p1.trees === p2.trees ? 0 : 1
    )
    .map(p => [p.address, p.trees] as [string, number]);

  const emissions = passports
    .filter(p => p.co2 > 0)
    .sort((p1, p2) => (p1.co2 > p2.co2 ? -1 : p1.co2 === p2.co2 ? 0 : 1))
    .map(p => [p.address, p.co2] as [string, number]);

  return { emissions, trees, emissionsByCountry, treesByCountry };
};

export const handler = async (event: any = {}) => {
  console.log("launched!");
  web3 = helpers.extendWeb3(new Web3(web3URL));
  const leaderboard = await getLeaderboard();
  console.log(JSON.stringify(leaderboard, null, 2));
  return true;
};

handler({})
  .then(o => console.log(o))
  .catch(e => console.error(e));
