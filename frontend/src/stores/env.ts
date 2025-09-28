import {IsWails} from "../../bindings/voxesis/src/Communication/InterProcess/utilsipc";
import {ref} from "vue";

export const isWails = ref(true);

function isWailsWithTimeout(): Promise<boolean> {
    return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
            resolve(false);
        }, 50);

        IsWails().then(ok => {
            clearTimeout(timeoutId);
            resolve(ok || false);
        }).catch(_ => {
            clearTimeout(timeoutId);
            resolve(false);
        });
    });
}

isWailsWithTimeout().then(result => {
    isWails.value = result;
});