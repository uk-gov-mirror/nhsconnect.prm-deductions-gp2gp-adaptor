import { initializeConfig } from '../../../config';
import { Builder } from 'xml2js';
import * as xml2js from 'xml2js';

export const updateExtractForSending = async (ehrExtract, ehrRequestId, receivingAsid) => {
  const config = initializeConfig();
  const parsedEhr = await new xml2js.Parser({ explicitArray: false }).parseStringPromise(
    ehrExtract
  );

  const sendingAsid = config.deductionsAsid;

  const rcmrUK06 = parsedEhr.RCMR_IN030000UK06;
  const controlActEvent = rcmrUK06.ControlActEvent;

  rcmrUK06.communicationFunctionRcv.device = updateId(
    rcmrUK06.communicationFunctionRcv.device,
    receivingAsid
  );
  rcmrUK06.communicationFunctionSnd.device = updateId(
    rcmrUK06.communicationFunctionSnd.device,
    sendingAsid
  );

  controlActEvent.author1.AgentSystemSDS.agentSystemSDS = updateId(
    controlActEvent.author1.AgentSystemSDS.agentSystemSDS,
    sendingAsid
  );
  controlActEvent.subject.EhrExtract.inFulfillmentOf.priorEhrRequest.id['$'].root = ehrRequestId;

  rcmrUK06.ControlActEvent = controlActEvent;
  parsedEhr.RCMR_IN030000UK06 = rcmrUK06;

  const builder = new Builder();
  return builder.buildObject(parsedEhr);
};

const updateId = (field, newId) => {
  field.id['$'].extension = newId;
  return field;
};
