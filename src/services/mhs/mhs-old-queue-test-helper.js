
//For now emptied the contents - not sure but probably this is not needed
export const sendMessage = message => new Promise((resolve) => resolve(message));

export const getRoutingInformation = odsCode => Promise.resolve({ asid: `asid-${odsCode}` });
