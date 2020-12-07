import axios from 'axios';
import adapter from 'axios/lib/adapters/http';
import { v4 } from 'uuid';
import testData from '../../src/templates/__tests__/testData.json';
import { config } from '../config';

const getAndValidatePatientPdsDetails = async nhsNumber => {
  const pdsResponse = await axios.get(
    `${config.gp2gpAdaptorUrl}/patient-demographics/${nhsNumber}`,
    {
      headers: {
        Authorization: config.gp2gpAdaptorAuthorizationKeys
      },
      adapter
    }
  );
  expect(pdsResponse.status).toBe(200);

  return pdsResponse.data.data;
};

const updateAndValidatePatientOdsCode = async (
  nhsNumber,
  pdsId,
  serialChangeNumber,
  newOdsCode
) => {
  const pdsResponse = await axios.patch(
    `${config.gp2gpAdaptorUrl}/patient-demographics/${nhsNumber}`,
    {
      pdsId,
      serialChangeNumber,
      newOdsCode,
      conversationId: v4()
    },
    {
      headers: {
        Authorization: config.gp2gpAdaptorAuthorizationKeys
      },
      adapter
    }
  );
  expect(pdsResponse.status).toBe(204);
};

describe('Patient ODS code update in PDS', () => {
  const RETRY_COUNT = 20;
  const POLLING_INTERVAL_MS = 500;
  // timeout for the jest test case
  const TIMEOUT = 3 * RETRY_COUNT * POLLING_INTERVAL_MS;
  const testData = {
    dev: {},
    test: {
      odsCode1: 'A20047',
      odsCode2: 'B86041',
      nhsNumber: 9692295990
    }
  };
  it(
    'should update ODS code of the patient',
    async () => {
      const { nhsNumber, odsCode1, odsCode2 } = testData[config.nhsEnvironment];
      const {
        odsCode: oldOdsCode,
        pdsId,
        serialChangeNumber
      } = await getAndValidatePatientPdsDetails(nhsNumber);

      let newOdsCode;
      if (oldOdsCode === odsCode1) {
        newOdsCode = odsCode2;
      } else if (oldOdsCode === odsCode2) {
        newOdsCode = odsCode1;
      } else {
        expect(
          true,
          'Patient allocated to automated tests is assigned to unexpected ODS code'
        ).toBe(false);
      }

      await updateAndValidatePatientOdsCode(nhsNumber, pdsId, serialChangeNumber, newOdsCode);

      // poll until ODS is as expected
      let patientOdsCode;
      for (let i = 0; i < RETRY_COUNT; i++) {
        const pdsDetails = await getAndValidatePatientPdsDetails(nhsNumber);
        patientOdsCode = pdsDetails.odsCode;
        await sleep(POLLING_INTERVAL_MS);
        if (patientOdsCode === newOdsCode) {
          break;
        }
      }
      expect(patientOdsCode).toBe(newOdsCode);
    },
    TIMEOUT
  );
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
