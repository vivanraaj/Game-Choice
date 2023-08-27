import {development, production, LensClient, PaginatedResult, ProfileFragment, ProfileSortCriteria} from "@lens-protocol/client";
import React, {useCallback, useEffect, useRef, useState} from 'react';
import Modal from 'react-modal';
import styles from "~~/styles/home.module.css";
import { useScaffoldEventSubscriber, useScaffoldContractWrite, useScaffoldContractRead } from "~~/hooks/scaffold-eth";

Modal.setAppElement(':root');

const lensClient = new LensClient({
  environment: development // use development for testnet and production for mainnet
});

export const ExploreProfiles = () => {
  const [profilesMap, setProfilesMap] = useState<Map<string, ProfileFragment>>(new Map());
  const [paginatedResult, setPaginatedResult] = useState<PaginatedResult<ProfileFragment> | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ProfileFragment | null>(null);
  const [userValue, setValue] = useState('0');
  const [result, setResult] = useState<boolean | null>(null);
  const [answer, setAnswer] = useState('0');
 

  const observer = useRef<IntersectionObserver | null>(null);
  const lastProfileElementRef = useEffect(node => {
    if (observer.current) observer.current?.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && paginatedResult?.next) {
        loadMoreProfiles();
      }
    });
    if (node) observer.current?.observe(node);
  }, [paginatedResult]);

  useEffect(() => {
    if(!paginatedResult) {
      lensClient.explore.profiles({
        sortCriteria: ProfileSortCriteria.MostFollowers
      })
        .then(result => {
          const newProfilesMap = new Map(profilesMap);
          result.items.forEach(profile => {
            newProfilesMap.set(profile.id, profile);
          });
          setProfilesMap(newProfilesMap);
          setPaginatedResult(result);
        })
    }
  }, [paginatedResult]);
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const onProfileClick = (profileId) => {
    const profile = profilesMap.get(profileId);
    // @ts-ignore
    setSelectedProfile(profile);
  };

  // const {data: answer} = useScaffoldContractRead({
  //   contractName: "GameChoice",
  //   functionName: "setResults",
  // });

  useScaffoldEventSubscriber({
    contractName: "GameChoice",
    eventName: "ResponseReceived",
    listener: (answer) => {
      setAnswer(answer)
      // console.log("the value is:", answer)
    },
  });

  const checkAnswer = () => {
    // Call the method in any function
    console.log("The answer is", answer);
    // BELOW IS THE LOGIC

    if (answer.toString() == userValue){
      setResult(true);
    }
    else{
      setResult(false);
    }
    // Reset the form fields
    setValue('');

    return result;
    };

 
  const { writeAsync, isLoading } = useScaffoldContractWrite({
    contractName: "GameChoice",
    functionName: "compare",
    // value: "1000000000",
    args: [selectedProfile?.id],
    onBlockConfirmation: txnReceipt => {
      console.log("📦 Transaction blockHash", txnReceipt.blockHash);
    },
  });

  const getProfilePicture = (profileId: string) => {
    const picture = profilesMap.get(profileId)?.picture;
    if (picture?.__typename === 'MediaSet') {
      return picture.original.url;
    } else if (picture?.__typename === 'NftImage') {
      return picture.uri;
    }
    return '/assets/theplugs-spark-creativity.png';
  }

  const loadMoreProfiles = () => {
    if (paginatedResult && paginatedResult.next) {
      paginatedResult.next().then(result => {
        if (result) {
          const newProfilesMap = new Map(profilesMap);
          result.items.forEach(profile => {
            newProfilesMap.set(profile.id, profile);
          });
          setProfilesMap(newProfilesMap);
          setPaginatedResult(result);
        }
      });
    }
  };

  const profileIds = Array.from(profilesMap.keys());
  return (
    <div className={styles.profileGrid} >
        {profileIds.map((profileId, index) => (
          <div ref={index === profileIds.length - 1 ? lastProfileElementRef : null} key={profileId} onClick={() => onProfileClick(profileId)} className={styles.profileContainer}>
            <picture><img className="thumbnail" src={getProfilePicture(profileId)} alt="Profile picture" /></picture>
            <h2>{profilesMap.get(profileId)?.name}</h2>
            <br />@{profilesMap.get(profileId)?.handle}
            <br />{profilesMap.get(profileId)?.id}
          </div>
        ))}
      <Modal
        isOpen={selectedProfile !== null}
        onRequestClose={() => setSelectedProfile(null)}
        className={styles.modalContent}
      >
        <div className={styles.div}>
          <div className={styles.overlap}>
            <div className={styles.title}> @{selectedProfile?.handle}</div>
            <picture><img className={styles.ellipse} src={getProfilePicture(selectedProfile?.id as string)} alt="Profile picture" /></picture>
          </div>
          <div className={styles.div2}>
            <div className={styles.modalHeader}>
              <div className={styles.text}>
                Profile Stats
              </div>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.textWrapper}>
                Profile ID: {selectedProfile?.id}
                {/* <br />
                Profile Name: {selectedProfile?.name}
                <br />
                Total Followers: {selectedProfile?.stats.totalFollowers}
                <br />
                Total Following: {selectedProfile?.stats.totalFollowing}
                <br />
                Total Posts: {selectedProfile?.stats.totalPosts} */}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <div className={styles.group2}>
          <input className={styles.overlapGroup4} type="number" value={userValue} onChange={e => { setValue(e.target.value);}}
                  placeholder="Predict Score" />
              < button className={styles.overlapGroup4} type="submit" onClick={() => writeAsync()}>
                Submit
                </button>
                  <button className={styles.overlapGroup4} type="submit" onClick={() => checkAnswer()}>

                  Check Answer
                  </button>
                  <button className={styles.overlapGroup4} onClick={() => setSelectedProfile(null)}>

                    Close
                  </button>
                  <div className={styles.text} >
                  <p> The score you guessed was {userValue} </p>
                  </div>
                  <div className={styles.text} >
                  <p>The value you entered is: {answer?.toString() || "323" }</p>
                  </div>
            </div>
          </div>
        </div>
        </div>
        </Modal>
    </div>
  );
};
