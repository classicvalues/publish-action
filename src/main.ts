import * as core from "@actions/core";
import * as github from "@actions/github";
import {
  updateRCTagBySHA,
  updateTag,
  validateIfReleaseIsPublished,
} from "./api-utils";
import {
  validateSemverVersionFromTag,
  getMajorTagFromFullTag,
} from "./version-utils";

async function run(): Promise<void> {
  try {
    const token = core.getInput("token");
    const octokitClient = github.getOctokit(token);
    const sourceTagName = core.getInput("source-tag");
    const rc = core.getInput("rc");
    const rcSHA = core.getInput("rc-sha");

    if (rc !== "") {
      if (rcSHA !== "") {
        await updateRCTagBySHA(rcSHA, "rc", octokitClient);
        core.info(`'rc' tag now points to the '${rcSHA}' commit`);
      } else {
        await updateTag(sourceTagName, "rc", octokitClient);

        core.setOutput("major-tag", "rc");
        core.info(`'rc' tag now points to the '${sourceTagName}' tag`);
      }
    } else {
      validateSemverVersionFromTag(sourceTagName);

      await validateIfReleaseIsPublished(sourceTagName, octokitClient);

      const majorTag = getMajorTagFromFullTag(sourceTagName);
      await updateTag(sourceTagName, majorTag, octokitClient);

      core.setOutput("major-tag", majorTag);
      core.info(
        `The '${majorTag}' major tag now points to the '${sourceTagName}' tag`
      );
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
