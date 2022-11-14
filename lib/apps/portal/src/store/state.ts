import { defineStore } from "pinia";

export type CoveringStatus = "loading" | "ok" | "error";

export const useState = defineStore("state", {
    state: () => {
        return {
            globalCoveringFlag: false,
            globalCoveringStatus: "loading" as CoveringStatus,
            globalCoveringMessage: null as string | null
        }
    },
    actions: {
        showGlobalCovering() {
            this.globalCoveringFlag = true;
        },
        hideGlobalCovering() {
            this.globalCoveringFlag = false;
        },
        toggleGlobalCovering() {
            this.globalCoveringFlag = !this.globalCoveringFlag;
        },
        setGlobalCoveringMessage(message: string) {
            this.globalCoveringMessage = message;
        },
        clearGlobalCoveringMessage() {
            this.globalCoveringMessage = null;
        },
        setGlobalCoveringStatus(status: CoveringStatus) {
            this.globalCoveringStatus = status;
        }
    }
})