import Web3 from "web3";
import { helpers, ExtendedWeb3, Unspent } from "leap-core";
import { countriesById } from "./api";
import { Player } from "./types";

let web3: ExtendedWeb3;
let web3Backend = "https://testnet-node.leapdao.org";
let playersAddresses = ["0x197970E48082CD46f277ABDb8afe492bCCd78300"];

type Passport = {
  address: string;
  country: string;
  name: string;
  avatar: string;
  co2: number;
  trees: number;
};

const init = () => (web3 = helpers.extendWeb3(new Web3(web3Backend)));

const parseNickname = (data: string) =>
  Web3.utils.hexToUtf8(`0x${data.substring(2, 42)}`);

const parseAvatarUrl = (data: string) =>
  Web3.utils.hexToString(`0x${data.substring(42, 50)}`);

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
          name: parseNickname(o.data!),
          avatar: parseAvatarUrl(o.data!),
          co2: parseCO2(o.data!),
          trees: parseTrees(o.data!)
        }))
    );

  const emissionsByCountry = sumByCountry(passports, "co2");
  const treesByCountry = sumByCountry(passports, "trees");

  const players = passports
    .map(p => ({
      id: p.address,
      name: p.name,
      avatar: p.avatar,
      event: p.country
    }))
    .reduce(
      (prev, current) => {
        prev[current.id] = current;
        return prev;
      },
      {} as { [id: string]: Player }
    );

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

  return { players, emissions, trees, emissionsByCountry, treesByCountry };
};

export const LeapAPI = {
  init,
  getStatus: async () => null,
  getPlayerList: async () => null,
  getLeaderboard: getLeaderboard,
  setServer: (server: string) => {
    web3Backend = server;
    if (web3) {
      init();
    }
  }
};

export default LeapAPI;
