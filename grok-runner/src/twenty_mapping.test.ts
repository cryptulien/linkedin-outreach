import { describe, expect, it } from "vitest";
import { STATUS_TO_STAGE, stageToStatus } from "./twenty_mapping.js";

describe("twenty mapping", () => {
  it("round-trips core stages", () => {
    expect(STATUS_TO_STAGE.non_invite).toBe("A_CONTACTER");
    expect(stageToStatus("INVITATION_ENVOYEE")).toBe("invite_envoye");
    expect(stageToStatus("CONNEXION_ACCEPTEE")).toBe("en_relation");
    expect(STATUS_TO_STAGE.message_a_valider).toBe("CONTACTE");
    expect(STATUS_TO_STAGE.message_envoye).toBe("MAIL_ENVOYE");
  });
});
