import Web3 from "web3";
import { helpers, ExtendedWeb3, Unspent } from "leap-core";
import { countriesById } from "./api";
import { Player } from "./types";

let web3: ExtendedWeb3;
let web3Backend = "https://testnet-node.leapdao.org";

const playersAddresses = [
  // @vrde
  "0x197970E48082CD46f277ABDb8afe492bCCd78300",
  // @tim
  "0xd3a3d22b832d91107f91309b560734bd12057531",
  // usa
  "0x752daE9A359CEc1efe0035E85C54c78312B08b61",
  "0xbdDe904D7592f686b6835E031A62118c7a0db715",
  "0x622d45449830A38d14cE830276Db2f671EafC179",
  "0x555F0a9404DeF2186FC45267427bE54d124c4EaB",
  "0x9ae4D5c7a2c20c22fdb18e740F6E92891B01F8F6",
  "0xd33654809852D11F4be4298607bE7FA7cFD656C6",
  "0x5e446Fc465Ae02e77017010ef7844e5549430175",
  "0x683A399EAc92c0CB8e798f422072DaCb50Ae21A3",
  "0xb4f4a06d50D8facDCae894578280454d73805416",
  "0x4C709990F94F56988D0914BeF22e24f158Bf0c3b",
  "0x60C44d61580e9073b256c381729B117399141871",
  "0xb732753e3C5d089775fAe789F413d175211C41d6",
  "0x5062204af38f35016DF5cFA750948Db4AC9138Eb",
  "0x8CCd1bc6841dA6998C633a5A4D92dF085EB6eE91",
  "0x9e7F78462de89Db9B9eA74c21a80739865360905",
  "0xA7C3a786C7EBaaf9812c70690782f7b4b5FD130f",
  "0xB5357cE0c2A7BE294BAC00c56E339A12dED0845b",
  "0x70D709fa3d07350dDaf5b98EF9F2750550dBefe1",
  "0x168B79bd866C8beF6B4342965c9A70B0Ca6A4077",
  "0x870DDEbBa1755239830220151E937Dbd63a3E03d",
  "0x1655049827C5a54383F480D6FeB13A97D6e6861C",
  "0x4535f4106016d3586c5e7F66F95cA1983b20c714",
  "0x9Be17c134bD4219dD4b7f41b3608EdCDff455a51",
  "0x5875a1BDC1551e89ea7E058F6FACf5163F3C1aCb",
  "0x345b6F6CEB1f502FD983EefC13e05f7F4977427E",
  // usb
  "0xB9D6e24270cb058A752786dd73D411B4dD85a893",
  "0x9EA3050658712c0595ecB8822439e7E9666f7C4d",
  "0xa08e24E112F002ae1CfCDd7806e24f1612FaD018",
  "0x849c86eC0a1F6a4e68a86A03514AF8c649B65CC8",
  "0x933654D9340D6ADB2FcAAF0FCBb2Dd4af007bCfc",
  "0x77D3b1b1F7C91a05fE374Aa8751dA2747930492f",
  "0x542e4C2C27AD661B24b346E6D577506e25DEd9c2",
  "0x135fd6bEc011FEEa1986443D5738b630A8973a53",
  "0x5aD67439d521c8fa770902431860578f1B61d37B",
  "0x12349b1Ff33Bf2525C0a2A5174CfB7dDB08A4b40",
  "0x001d5a5Fe140C200561314611dAB5c538e7CA2eC",
  "0xF6d1EBb5871676b5a0A01F31F97e749A116f5169",
  "0xDA1fc1EeD9efe8988377efa17487f3a3D3D184D8",
  "0x44E91212fa284a30289954b9C50dfe5f2B755B1d",
  "0xB5fB81813f36a3dE6375D7F6FcB52Dc23D701979",
  "0x4F7Ab3207F1AdE49b4cCE9FF8271d163D57D47Cb",
  "0xB81B2d4e3C7CE126B9c1185BeF973e7e7Bac1675",
  "0xEa3fF6a62BA06F8250EdD0De1980C9E9fC603C75",
  "0x0A289424cD0A5Fc3c92873c6Fd3d523fEBFFd701",
  "0x2c3bA5CD8De4434242410effb8eB747BaD967A73",
  "0x4e801e054F52Cbf50735a3764f9dF2Db16aEceED",
  "0x35B56A7977168e52B9170e1e933C7fc79e7B7E2E",
  "0xe0468256c407f410419B951c0E0f323638520aCa",
  "0xaf03f53a1535E4a94af2A1Bc1BC0bC732d03D41B",
  "0x64D9629C61cC6713c127CC01Ce21eF4c91F87863"
];

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
