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

type Player = {
  avatar: string;
  name: string;
  event: string;
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

  for (const promise of promises) {
    try {
      promise.value = await promise.task;
    } catch (error) {
      console.log(`error while fetching unspent of ${promise.id}: ${error}`);
      promise.value = [];
    }
  }

  const passports: Passport[] = promises
    .filter(p => p.value)
    .flatMap(p =>
      p
        .value!.map(u => u.output)
        .filter(o => countriesById[o.color])
        .map(o => ({
          address: o.value,
          country: countriesById[o.color],
          co2: parseCO2(o.data!),
          trees: parseTrees(o.data!)
        }))
    );

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
  console.log(JSON.stringify(getLeaderboard(), null, 2));
  return true;
};
