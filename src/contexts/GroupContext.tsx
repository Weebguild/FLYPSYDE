import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase';
import { ref, query, orderByChild, equalTo, onValue } from 'firebase/database';
import { Group } from '../types';
import { useAuth } from './AuthContext';

interface GroupContextType {
  currentGroup: Group | null;
  loading: boolean;
}

const GroupContext = createContext<GroupContextType>({
  currentGroup: null,
  loading: true
});

export const useGroup = () => useContext(GroupContext);

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile } = useAuth();
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We now rely on userProfile.groupCode because array-contains is not in RTDB.
    if (!currentUser || !userProfile || !userProfile.groupCode) {
      setCurrentGroup(null);
      setLoading(false);
      return;
    }

    const groupRef = query(
      ref(db, 'groups'), 
      orderByChild('groupCode'), 
      equalTo(userProfile.groupCode)
    );

    const unsubscribe = onValue(groupRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Since orderByChild can return multiple, we just take the first
        const groupId = Object.keys(data)[0];
        const groupData = data[groupId] as Group;
        
        setCurrentGroup({ ...groupData, id: groupId });
      } else {
        setCurrentGroup(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, userProfile]);

  return (
    <GroupContext.Provider value={{ currentGroup, loading }}>
        {children}
    </GroupContext.Provider>
  );
};
