import { getDiff } from "./utils/git";
import { getVersions } from "./utils/npm";
import { resolve } from "./utils/path";

(async function() {
    let versions = await getVersions("ethers");
    versions = versions.filter((h) => (h.version.match(/^6\.[0-9]+\.[0-9]+$/)));
    for (let i = 1; i < versions.length; i++) {
        const tag0 = versions[i - 1].gitHead, tag1 = versions[i].gitHead;
        const diff = await getDiff(resolve("dist/ethers"), tag0, tag1);
        console.log(diff);
    }
})();
