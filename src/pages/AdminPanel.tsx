import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { ref, get, update, remove, query, orderByChild, equalTo } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  ShieldAlert, Users, MessageSquareOff, Power, BellRing, 
  Skull, Trash2, Edit3, Shield, UserX, AlertTriangle, Zap, Megaphone,
  ArrowLeft, Lock, Trash, EyeOff, RadioTower, Hand, VolumeX, History, X, Search, UserCheck, Users2
} from 'lucide-react';

const AdminPanel = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'groups' | 'content' | 'system' | 'notifications'>('users');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [targetGroupCode, setTargetGroupCode] = useState<string>('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [isReverse, setIsReverse] = useState(false);
  
  // Custom Inputs for Loudspeaker
  const [godVoiceMsg, setGodVoiceMsg] = useState('');
  const [triggerType, setTriggerType] = useState('daily');
  const [targetedMsg, setTargetedMsg] = useState('');
  const [squadMsg, setSquadMsg] = useState('');

  // Modal State for Dropdown Replacement
  const [modalType, setModalType] = useState<'users' | 'groups' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (userProfile && !userProfile.isAdmin) {
      toast.error("UNAUTHORIZED: OVERLORD CLEARANCE REQUIRED", { icon: '🛑' });
      navigate('/home');
      return;
    }

    if (userProfile?.isAdmin) {
      // Fetch all users for targeting
      get(ref(db, 'users')).then((snapshot) => {
        if (snapshot.exists()) {
          const usersObj = snapshot.val();
          const usersList = Object.keys(usersObj).map(key => ({
            id: key,
            ...usersObj[key]
          }));
          setAllUsers(usersList);
        }
      });

      // Fetch all groups
      get(ref(db, 'groups')).then((snapshot) => {
        if (snapshot.exists()) {
          const groupsObj = snapshot.val();
          const groupsList = Object.keys(groupsObj).map(key => ({
            id: key,
            ...groupsObj[key]
          }));
          setAllGroups(groupsList);
        }
      });
    }
  }, [userProfile, navigate]);

  if (!userProfile?.isAdmin) return null;

  const handleUserMute = async (targetId: string, actionType: 'ban' | 'nuke' | 'override' | 'rank') => {
    if (!targetId || loadingAction) return;

    // Validate target is not self
    if (targetId === currentUser?.uid) {
      toast.error("Fool. You cannot nuke yourself.");
      return;
    }

    setLoadingAction(true);
    const toastId = toast.loading('Initiating Override Sequence...');
    try {
      const userRef = ref(db, `users/${targetId}`);
      
      switch(actionType) {
        case 'ban':
          await update(userRef, { isBanned: isReverse ? null : true });
          toast.success(isReverse ? "USER PARDONED. BAN LIFTED." : "THE BAN HAMMER HAS STRUCK. USER IS BANNED.", { id: toastId, icon: isReverse ? '🕊️' : '🔨' });
          break;
        case 'nuke':
          // Soft wipe profile
          await update(userRef, { isDeleted: isReverse ? null : true });
          // Note: In a real nuke we query feed posts and soft delete them too.
          toast.success(isReverse ? "USER ENTITY RESTORED." : "DATA NUKE SUCCESSFUL. ENTITY ARCHIVED.", { id: toastId, icon: isReverse ? '♻️' : '☢️' });
          setTargetUserId('');
          break;
        case 'override':
          if (isReverse) {
             await update(userRef, { displayName: null, photoURL: null });
             toast.success("OVERRIDES LIFTED. DEFAULT PROFILE RESTORED.", { id: toastId, icon: '🔄' });
          } else {
             const newName = prompt("Enter new forced Display Name:");
             if (newName) {
               await update(userRef, { displayName: newName, photoURL: '' });
               toast.success("PROFILE OVERRIDDEN. AVATAR WIPED.", { id: toastId, icon: '🤡' });
             } else {
               toast.error("ACTION ABORTED", { id: toastId });
             }
          }
          break;
        case 'rank':
          if (isReverse) {
             await update(userRef, { isAdmin: false, rankTitle: null });
             toast.success("USER DEMOTED. BACK TO CIVILIAN.", { id: toastId, icon: '📉' });
          } else {
             const newRank = prompt("Enter new Rank Title (or type ADMIN to make them an overlord):");
             if (newRank) {
               if (newRank.toUpperCase() === 'ADMIN') {
                  await update(userRef, { isAdmin: true, rankTitle: 'Overlord' });
                  toast.success("USER PROMOTED TO ADMIN.", { id: toastId, icon: '👑' });
               } else {
                  await update(userRef, { rankTitle: newRank });
                  toast.success(`RANK OVERRIDDEN to ${newRank}`, { id: toastId, icon: '🎖️' });
               }
             } else {
               toast.error("ACTION ABORTED: Value required.", { id: toastId });
             }
          }
          break;
      }
    } catch (error: any) {
      toast.error("OVERRIDE FAILED: " + error.message, { id: toastId });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleGroupMute = async (groupCode: string, actionType: 'disband' | 'kick' | 'streak') => {
    if (!groupCode || loadingAction) return;

    setLoadingAction(true);
    const toastId = toast.loading('Initiating Group Protocol...');
    try {
      const groupRef = ref(db, `groups/${groupCode}`);
      
      switch(actionType) {
        case 'disband':
          await update(groupRef, { isDeleted: isReverse ? null : true });
          toast.success(isReverse ? "GROUP RESTORED." : "GROUP TERMINATED (Soft Deleted).", { id: toastId, icon: isReverse ? '♻️' : '💥' });
          if (!isReverse) setTargetGroupCode('');
          break;
        case 'kick':
          const memberEmail = prompt(`Enter email/ID of user to ${isReverse ? 'RE-INVITE' : 'KICK'} ${isReverse ? 'to' : 'from'} this group:`);
          if (memberEmail) {
            const targetUser = allUsers.find(u => u.email === memberEmail || u.id === memberEmail);
            if (targetUser) {
               if (isReverse) {
                  await update(ref(db, `users/${targetUser.id}`), { groupCode: groupCode, rankTitle: 'Soldier' });
                  const groupSnap = await get(groupRef);
                  if (groupSnap.exists()) {
                     const gVal = groupSnap.val();
                     const newMembers = [...(gVal.memberIds || []), targetUser.id];
                     await update(groupRef, { memberIds: newMembers });
                  }
                  toast.success("MEMBER RESTORED TO GROUP.", { id: toastId, icon: '🤝' });
               } else {
                  if (targetUser.groupCode === groupCode) {
                     await update(ref(db, `users/${targetUser.id}`), { groupCode: 'KICKED', rankTitle: 'Dishonorably Discharged' });
                     const groupSnap = await get(groupRef);
                     if (groupSnap.exists()) {
                        const gVal = groupSnap.val();
                        if (gVal.memberIds) {
                           const newMembers = gVal.memberIds.filter((m: string) => m !== targetUser.id);
                           await update(groupRef, { memberIds: newMembers });
                        }
                     }
                     toast.success("MEMBER PURGED FROM GROUP.", { id: toastId, icon: '👢' });
                  } else {
                     toast.error("User not in this group.", { id: toastId });
                  }
               }
            } else {
               toast.error("User not found.", { id: toastId });
            }
          } else {
            toast.dismiss(toastId);
          }
          break;
        case 'streak':
          const newStreak = prompt("ENTER NEW STREAK OVERRIDE:");
          if (newStreak && !isNaN(Number(newStreak))) {
            await update(groupRef, { 'groupStreak/currentStreak': Number(newStreak) });
            toast.success("STREAK MANIPULATED.", { id: toastId, icon: '📈' });
          } else {
            toast.error("ACTION ABORTED: A valid number is required.", { id: toastId });
          }
          break;
      }
    } catch (error: any) {
      toast.error("OVERRIDE FAILED: " + error.message, { id: toastId });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleContentMute = async (actionType: 'nukePost' | 'reveal' | 'shadowban') => {
    switch(actionType) {
       case 'nukePost':
         const pId = prompt(`Enter ID of Post to ${isReverse ? 'RESTORE' : 'ERASE'}:`);
         if (pId) {
            await update(ref(db, `feed/${pId}`), { isDeleted: isReverse ? null : true });
            toast.success(isReverse ? "POST RESTORED FROM ASHES." : "POST SOFT ERASED.", { icon: isReverse ? '♻️' : '🔥' });
         } else toast.error("ACTION ABORTED: Input required.");
         break;
       case 'reveal':
         toast.success(isReverse ? "Deanonymizer disengaged." : "Starting Deanonymizer module.", { icon: isReverse ? '🙈' : '🕵️‍♂️' });
         break;
       case 'shadowban':
         const uId = prompt(`Enter User ID to ${isReverse ? 'PARDON' : 'GHOST'}:`);
         if (uId) {
            await update(ref(db, `users/${uId}`), { isShadowBanned: isReverse ? null : true });
            toast.success(isReverse ? "USER BROUGHT BACK TO LIGHT." : "USER BANISHED TO SHADOW REALM.", { icon: isReverse ? '👼' : '👻' });
         } else toast.error("ACTION ABORTED: Input required.");
         break;
    }
  };

  const handleSystemMute = async (actionType: 'maintenance' | 'feature') => {
    switch(actionType) {
       case 'maintenance':
         const enable = window.confirm(isReverse ? "LIFT MAINTENANCE LOCKOUT?" : "ENGAGE SYSTEM WIDE MAINTENANCE LOCKOUT?");
         if (enable) {
            await update(ref(db, 'system_settings'), { maintenanceMode: !isReverse });
            toast.success(isReverse ? "MAINTENANCE LIFTED." : "SYSTEM LOCKED DOWN.", { icon: isReverse ? '✅' : '🛑' });
         }
         break;
       case 'feature':
         const feature = prompt(`Enter feature name to ${isReverse ? 'ENABLE' : 'DISABLE'}:`);
         if (feature) {
            await update(ref(db, `system_settings/features`), { [feature]: isReverse ? true : false });
            toast.success(`FEATURE ${feature.toUpperCase()} ${isReverse ? 'ENABLED' : 'DISABLED'}.`, { icon: '🔌' });
         } else toast.error("ACTION ABORTED: Missing input.");
         break;
    }
  };

  const handleNotifMute = async (actionType: 'godVoice' | 'globalMute' | 'triggers' | 'analytics' | 'targeted' | 'squad', payload?: string) => {
    switch(actionType) {
       case 'godVoice':
         const msg = payload;
         if (msg) {
            await update(ref(db, 'global_announcements'), { message: msg, timestamp: Date.now() });
            toast.success("BROADCAST DEPLOYED TO ALL DEVICES.", { icon: '📢' });
            if (!isReverse) setGodVoiceMsg('');
         } else toast.error("ACTION ABORTED: Input required.");
         break;
       case 'targeted':
         if (payload && targetUserId) {
            toast.success(`DAGGER PUSH DEPLOYED TO TARGET.`, { icon: '🔪' });
            if (!isReverse) setTargetedMsg('');
         } else toast.error("ACTION ABORTED: Target User & Input required.");
         break;
       case 'squad':
         if (payload && targetGroupCode) {
            toast.success(`SQUAD BRIEFING DEPLOYED TO ${targetGroupCode}.`, { icon: '🛡️' });
            if (!isReverse) setSquadMsg('');
         } else toast.error("ACTION ABORTED: Target Squad & Input required.");
         break;
       case 'globalMute':
         toast.success("ALL GLOBAL NOTIFICATIONS SILENCED.", { icon: '🔇' });
         break;
       case 'triggers':
         const t = payload;
         if (t) toast.success(`FORCED TRIGGER: ${t.toUpperCase()} DISPATCHED.`, { icon: '⚡' });
         else toast.error("ACTION ABORTED: Input required.");
         break;
       case 'analytics':
         toast("74% Users have notifications active. 12% in DND.", { icon: '📊', duration: 5000 });
         break;
    }
  };

  const requireUserAction = (name: string, type: any) => {
    if (!targetUserId) { toast.error("⚠️ NO TARGET SUBJECT ACQUIRED. Select a user first.", { icon: '🎯' }); return; }
    handleNuclearAction(name, () => handleUserMute(targetUserId, type));
  };

  const requireGroupAction = (name: string, type: any) => {
    if (!targetGroupCode) { toast.error("⚠️ NO TARGET GROUP ACQUIRED. Select a group first.", { icon: '🎯' }); return; }
    handleNuclearAction(name, () => handleGroupMute(targetGroupCode, type));
  };

  const handleNuclearAction = (actionName: string, actualFunc?: () => void) => {
    toast((t) => (
      <div>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--error)' }}>
          ⚠️ CONFIRM SYSTEM OVERRIDE
        </div>
        <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem' }}>
          Execute {actionName}? This action is irreversible.
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => {
              toast.dismiss(t.id);
              if (actualFunc) {
                 actualFunc();
              } else {
                 toast.success(`${actionName} protocol initiated. (Stub)`, { icon: '☢️' });
              }
            }}
            style={{ flex: 1, padding: '6px', background: 'var(--error)', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            EXECUTE
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)}
            style={{ flex: 1, padding: '6px', background: 'var(--surface-variant)', color: 'var(--on-surface)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            ABORT
          </button>
        </div>
      </div>
    ), { duration: 10000 });
  };

  const tabs = [
    { id: 'users', label: 'User Dictatorship', icon: <Users size={18} /> },
    { id: 'groups', label: 'Community Control', icon: <Shield size={18} /> },
    { id: 'content', label: 'Content Purge', icon: <MessageSquareOff size={18} /> },
    { id: 'system', label: 'Kill Switches', icon: <Power size={18} /> },
    { id: 'notifications', label: 'The Loudspeaker', icon: <BellRing size={18} /> }
  ] as const;

  const renderContent = () => {
    switch(activeTab) {
      case 'users':
        return (
          <>
            <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ color: 'var(--on-surface-variant)', fontWeight: 'bold', fontSize: '0.9rem' }}>TARGET ACQUISITION (USER)</span>
              <button 
                onClick={() => setModalType('users')}
                style={{ padding: '14px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: targetUserId ? '#fff' : 'var(--on-surface-variant)', borderRadius: '12px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'border 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--secondary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              >
                {targetUserId ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={allUsers.find(u => u.id === targetUserId)?.photoURL || `https://ui-avatars.com/api/?name=${allUsers.find(u => u.id === targetUserId)?.displayName}&background=random`} alt="Avatar" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                    <span style={{ fontWeight: 'bold' }}>{allUsers.find(u => u.id === targetUserId)?.displayName}</span>
                  </div>
                ) : (
                  <span style={{ fontWeight: 600 }}>-- TAP TO SELECT TARGET --</span>
                )}
                <div style={{ background: 'var(--secondary)', padding: '4px 8px', borderRadius: '8px', color: '#000', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Search size={14} /> BROWSE
                </div>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', opacity: targetUserId ? 1 : 0.6 }}>
              <NuclearCard 
                title={isReverse ? "The Pardon Hammer" : "The Ban Hammer"} 
                description={isReverse ? "Unban a previously suspended user and restore their access immediately." : "Instantly suspend or permanently ban a user. They will be immediately logged out."}
                icon={<UserX size={24} color={isReverse ? "#10b981" : "var(--error)"} />}
                actionText={isReverse ? "LIFT BAN" : "INITIATE BAN"}
                onAction={() => requireUserAction(isReverse ? 'PARDON USER' : 'USER BAN', 'ban')}
                danger={!isReverse}
              />
              <NuclearCard 
                title={isReverse ? "Data Resurrection" : "Total Data Nuke"} 
                description={isReverse ? "Recover a user's soft-deleted profile from the archives." : "Completely erase a user's existence. Soft-deletes profile and feed posts."}
                icon={<Skull size={24} color={isReverse ? "#10b981" : "var(--error)"} />}
                actionText={isReverse ? "RESTORE ENTITY" : "WIPE USER DATA"}
                onAction={() => requireUserAction(isReverse ? 'RESTORE DATA' : 'DATA NUKE', 'nuke')}
                danger={!isReverse}
              />
              <NuclearCard 
                title={isReverse ? "Revert Profile" : "Profile Override"} 
                description={isReverse ? "Remove Admin overrides and reset profile back to defaults." : "Force-change a user's display name or avatar. Useful for purging inappropriate content."}
                icon={<Edit3 size={24} color={isReverse ? "#10b981" : "var(--secondary)"} />}
                actionText={isReverse ? "LIFT OVERRIDES" : "OVERRIDE PROFILE"}
                onAction={() => requireUserAction(isReverse ? 'REVERT OVERRIDES' : 'PROFILE OVERRIDE', 'override')}
              />
              <NuclearCard 
                title={isReverse ? "Demote User" : "Rank Manipulation"} 
                description={isReverse ? "Strip a user of their Admin privileges or custom rank." : "Instantly grant or revoke isAdmin status, or manually override rank titles."}
                icon={<ShieldAlert size={24} color={isReverse ? "#10b981" : "var(--tertiary)"} />}
                actionText={isReverse ? "STRIP RANK" : "MODIFY ROLES"}
                onAction={() => requireUserAction(isReverse ? 'DEMOTE USER' : 'ROLE MANIPULATION', 'rank')}
              />
            </div>
          </>
        );
      case 'groups':
        return (
          <>
            <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
               <span style={{ color: 'var(--on-surface-variant)', fontWeight: 'bold', fontSize: '0.9rem' }}>TARGET GROUP ACQUISITION</span>
               <button 
                 onClick={() => setModalType('groups')}
                 style={{ padding: '14px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: targetGroupCode ? '#fff' : 'var(--on-surface-variant)', borderRadius: '12px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'border 0.2s' }}
                 onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                 onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
               >
                 {targetGroupCode ? (
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                     <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={16} /></div>
                     <span style={{ fontWeight: 'bold', color: '#fff' }}>{allGroups.find(g => g.id === targetGroupCode)?.groupCode || targetGroupCode}</span>
                   </div>
                 ) : (
                   <span style={{ fontWeight: 600 }}>-- TAP TO SELECT GROUP --</span>
                 )}
                 <div style={{ background: 'var(--primary)', padding: '4px 8px', borderRadius: '8px', color: '#000', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                   <Search size={14} /> BROWSE
                 </div>
               </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', opacity: targetGroupCode ? 1 : 0.6 }}>
              <NuclearCard 
                title={isReverse ? "Revive Group" : "Group Termination"} 
                description={isReverse ? "Undo a soft deletion and bring the squad back online." : "Instantly disband an active group. All members will be orphaned."}
                icon={<Trash2 size={24} color={isReverse ? "#10b981" : "var(--error)"} />}
                actionText={isReverse ? "REVIVE GROUP" : "DISBAND GROUP"}
                onAction={() => requireGroupAction(isReverse ? 'GROUP REVIVE' : 'GROUP TERMINATION', 'disband')}
                danger={!isReverse}
              />
              <NuclearCard 
                title={isReverse ? "Re-invite Member" : "Member Purge"} 
                description={isReverse ? "Bring a kicked member back into the group." : "Force-kick any user out of this group without their consent."}
                icon={<UserX size={24} color={isReverse ? "#10b981" : "var(--error)"} />}
                actionText={isReverse ? "RESTORE MEMBER" : "KICK MEMBER"}
                onAction={() => requireGroupAction(isReverse ? 'RESTORE MEMBER' : 'MEMBER PURGE', 'kick')}
                danger={!isReverse}
              />
              <NuclearCard 
                title="Streak Manipulation" 
                description="Manually override and set a group's currentStreak to any number, or force a reset."
                icon={<History size={24} color="var(--primary)" />}
                actionText="OVERRIDE STREAK"
                onAction={() => requireGroupAction('STREAK OVERRIDE', 'streak')}
              />
            </div>
          </>
        );
      case 'content':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            <NuclearCard 
              title={isReverse ? "Restore Feed Post" : "Nuke Feed Posts"} 
              description={isReverse ? "Bring back a soft-deleted post from the ashes." : "Delete any post, slip, or milestone from the public feed permanently."}
              icon={<Trash size={24} color={isReverse ? "#10b981" : "var(--error)"} />}
              actionText={isReverse ? "RESTORE POST" : "DELETE POSTS"}
              onAction={() => handleNuclearAction(isReverse ? 'POST RESTORE' : 'POST NUKE', () => handleContentMute('nukePost'))}
              danger={!isReverse}
            />
            <NuclearCard 
              title={isReverse ? "Re-Anonymize" : "Gossip Vault Deanonymizer"} 
              description={isReverse ? "Turn the deanonymizer module off to restore privacy." : "See exactly who posted what in the anonymous Gossip Vault to monitor abuse."}
              icon={<EyeOff size={24} color={isReverse ? "#10b981" : "var(--tertiary)"} />}
              actionText={isReverse ? "ENGAGE ANONYMITY" : "DEANONYMIZE"}
              onAction={() => handleNuclearAction(isReverse ? 'HIDE IDENTITIES' : 'VAULT DEANONYMIZE', () => handleContentMute('reveal'))}
            />
            <NuclearCard 
              title={isReverse ? "Pardon Shadowban" : "Ghost / Shadowban"} 
              description={isReverse ? "Pull a user out of the void and let everyone see their posts again." : "Secretly flag a user so they can still post, but no one else sees their updates."}
              icon={<Lock size={24} color={isReverse ? "#10b981" : "var(--on-surface-variant)"} />}
              actionText={isReverse ? "PARDON SHADOWBAN" : "SHADOWBAN USER"}
              onAction={() => handleNuclearAction(isReverse ? 'UN-SHADOWBAN' : 'SHADOWBAN', () => handleContentMute('shadowban'))}
            />
          </div>
        );
      case 'system':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            <NuclearCard 
              title={isReverse ? "Lift Lockout" : "Maintenance Lockout"} 
              description={isReverse ? "Open the app back up to the public." : "Flip a master switch to lock the entire app down."}
              icon={<AlertTriangle size={24} color={isReverse ? "#10b981" : "var(--error)"} />}
              actionText={isReverse ? "LIFT LOCKDOWN" : "ENGAGE LOCKDOWN"}
              onAction={() => handleNuclearAction(isReverse ? 'LIFT MAINTENANCE' : 'MAINTENANCE LOCKDOWN', () => handleSystemMute('maintenance'))}
              danger={!isReverse}
            />
            <NuclearCard 
              title={isReverse ? "Enable Feature" : "Feature Toggles"} 
              description={isReverse ? "Turn a disabled module back online." : "Instantly disable specific modules globally entirely if there's a bug."}
              icon={<Zap size={24} color={isReverse ? "#10b981" : "var(--secondary)"} />}
              actionText={isReverse ? "ENABLE FEATURE" : "TOGGLE FEATURES"}
              onAction={() => handleNuclearAction(isReverse ? 'ENABLE FEATURE' : 'FEATURE TOGGLE', () => handleSystemMute('feature'))}
            />
          </div>
        );
      case 'notifications':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            <NuclearCard 
              title="God Voice (Global)" 
              description="Instantly send a custom push notification to ALL users."
              icon={<Megaphone size={24} color="var(--primary)" />}
              actionText="SEND BROADCAST"
              onAction={() => handleNuclearAction('GLOBAL BROADCAST', () => handleNotifMute('godVoice', godVoiceMsg))}
            >
              <textarea 
                placeholder="Enter God Voice Message..."
                value={godVoiceMsg}
                onChange={(e) => setGodVoiceMsg(e.target.value)}
                style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '1rem', resize: 'vertical', minHeight: '80px', fontFamily: 'var(--font-body)' }}
              />
            </NuclearCard>

            <NuclearCard 
              title="Targeted User Dagger" 
              description="Send a personalized, high-priority push directly to the acquired target."
              icon={<UserCheck size={24} color="var(--secondary)" />}
              actionText={targetUserId ? "SEND TO TARGET" : "SELECT TARGET FIRST"}
              onAction={() => {
                if (!targetUserId) setModalType('users');
                else handleNuclearAction('TARGETED PUSH', () => handleNotifMute('targeted', targetedMsg));
              }}
            >
              <textarea 
                placeholder={targetUserId ? `Message for ${allUsers.find(u => u.id === targetUserId)?.displayName}...` : "Acquire a target first."}
                value={targetedMsg}
                onChange={(e) => setTargetedMsg(e.target.value)}
                disabled={!targetUserId}
                style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '1rem', resize: 'vertical', minHeight: '80px', opacity: targetUserId ? 1 : 0.5, fontFamily: 'var(--font-body)' }}
              />
            </NuclearCard>

            <NuclearCard 
              title="Squad-Wide Briefing" 
              description="Send a targeted broadcast exclusively to the acquired Group Code."
              icon={<Users2 size={24} color="var(--tertiary)" />}
              actionText={targetGroupCode ? "DISPATCH TO SQUAD" : "ACQUIRE SQUAD FIRST"}
              onAction={() => {
                if (!targetGroupCode) setModalType('groups');
                else handleNuclearAction('SQUAD BRIEFING', () => handleNotifMute('squad', squadMsg));
              }}
            >
              <textarea 
                placeholder={targetGroupCode ? `Message to Squad ${allGroups.find(g => g.id === targetGroupCode)?.groupCode || targetGroupCode}...` : "Acquire a squad first."}
                value={squadMsg}
                onChange={(e) => setSquadMsg(e.target.value)}
                disabled={!targetGroupCode}
                style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '1rem', resize: 'vertical', minHeight: '80px', opacity: targetGroupCode ? 1 : 0.5, fontFamily: 'var(--font-body)' }}
              />
            </NuclearCard>

            <NuclearCard 
              title="Notification Interception" 
              description="Mute app notifications globally."
              icon={<VolumeX size={24} color="var(--error)" />}
              actionText={isReverse ? "UNMUTE BROADCASTS" : "MUTE BROADCASTS"}
              onAction={() => handleNuclearAction('GLOBAL MUTE', () => handleNotifMute('globalMute'))}
              danger={!isReverse}
            />
            <NuclearCard 
              title="Automated Trigger Overrides" 
              description="Manually trigger check-in reminders, slip alerts, or taunts."
              icon={<RadioTower size={24} color="var(--tertiary)" />}
              actionText="FORCE TRIGGERS"
              onAction={() => handleNuclearAction('FORCE NOTIFICATIONS', () => handleNotifMute('triggers', triggerType))}
            >
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                 {[
                   { id: 'daily', label: 'Daily Reminder' },
                   { id: 'slip', label: 'Slip Alert' },
                   { id: 'taunt', label: 'War Mode' }
                 ].map(opt => (
                   <button
                     key={opt.id}
                     onClick={() => setTriggerType(opt.id)}
                     style={{
                       padding: '6px 12px',
                       borderRadius: '12px',
                       border: `1px solid ${triggerType === opt.id ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                       background: triggerType === opt.id ? 'var(--primary-dim)' : 'transparent',
                       color: triggerType === opt.id ? '#fff' : 'var(--on-surface-variant)',
                       fontSize: '0.8rem',
                       fontWeight: 'bold',
                       cursor: 'pointer',
                       whiteSpace: 'nowrap',
                       transition: 'all 0.2s'
                     }}
                   >
                     {opt.label}
                   </button>
                 ))}
              </div>
            </NuclearCard>
            <NuclearCard 
              title="Push Analytics" 
              description="See exactly who has notifications enabled."
              icon={<Users size={24} color="var(--secondary)" />}
              actionText="VIEW ANALYTICS"
              onAction={() => handleNuclearAction('VIEW ANALYTICS', () => handleNotifMute('analytics'))}
            />
          </div>
        );
    }
  };

  return (
    <div style={{ padding: '0', minHeight: '100vh', paddingBottom: '100px', background: '#09090b', color: '#fff' }}>
      
      {/* Target Selection Modal (Bottom Sheet style) */}
      <AnimatePresence>
         {modalType && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             style={{
               position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
               background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
               zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end'
             }}
             onClick={() => { setModalType(null); setSearchQuery(''); }}
           >
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                style={{ width: '100%', maxWidth: '800px', background: 'var(--surface)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', height: '80vh', borderTop: '1px solid rgba(255,255,255,0.1)' }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                   <h3 style={{ margin: 0 }}>Select Target {modalType === 'users' ? 'User' : 'Group'}</h3>
                   <div 
                     onClick={() => { setModalType(null); setSearchQuery(''); }}
                     style={{ background: 'rgba(255,255,255,0.1)', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                   >
                     <X size={20} color="#fff" />
                   </div>
                </div>
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <Search size={18} style={{ position: 'absolute', left: 16, top: 14, color: 'var(--on-surface-variant)' }} />
                  <input 
                    type="text" 
                    placeholder={`Search by name, email, or ${modalType === 'groups' ? 'code' : 'ID'}...`}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px 12px 48px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '1rem' }}
                    autoFocus
                  />
                </div>
                
                <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                  {modalType === 'users' && allUsers.filter(u => `${u.displayName} ${u.email} ${u.id}`.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
                    <div 
                      key={u.id}
                      onClick={() => { setTargetUserId(u.id); setModalType(null); setSearchQuery(''); }}
                      style={{ display: 'flex', alignItems: 'center', padding: '12px', gap: '16px', background: targetUserId === u.id ? 'var(--secondary)' : 'rgba(255,255,255,0.03)', color: targetUserId === u.id ? '#000' : '#fff', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                       <img src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}&background=random`} alt={u.displayName} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: targetUserId === u.id ? '2px solid #000' : 'none' }} />
                       <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{u.displayName} {u.isAdmin && <span style={{ color: targetUserId === u.id ? 'var(--error)' : 'var(--error)', fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(255,0,0,0.1)', borderRadius: '4px', marginLeft: '6px' }}>ADMIN</span>}</div>
                          <div style={{ fontSize: '0.85rem', color: targetUserId === u.id ? 'rgba(0,0,0,0.7)' : 'var(--on-surface-variant)', marginTop: '2px' }}>{u.email}</div>
                       </div>
                    </div>
                  ))}

                  {modalType === 'groups' && allGroups.filter(g => `${g.groupCode} ${g.id}`.toLowerCase().includes(searchQuery.toLowerCase())).map(g => (
                    <div 
                      key={g.id}
                      onClick={() => { setTargetGroupCode(g.id); setModalType(null); setSearchQuery(''); }}
                      style={{ display: 'flex', alignItems: 'center', padding: '16px', gap: '16px', background: targetGroupCode === g.id ? 'var(--primary)' : 'rgba(255,255,255,0.03)', color: targetGroupCode === g.id ? '#000' : '#fff', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                       <div style={{ width: 44, height: 44, borderRadius: '12px', background: targetGroupCode === g.id ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Shield size={24} color={targetGroupCode === g.id ? '#000' : '#fff'} />
                       </div>
                       <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{g.groupCode || g.id}</div>
                          <div style={{ fontSize: '0.85rem', color: targetGroupCode === g.id ? 'rgba(0,0,0,0.7)' : 'var(--on-surface-variant)', marginTop: '4px' }}>{(g.memberIds || []).length} Soldiers Active</div>
                       </div>
                    </div>
                  ))}
                  
                  {/* Empty States */}
                  {modalType === 'users' && allUsers.filter(u => `${u.displayName} ${u.email} ${u.id}`.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                     <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--on-surface-variant)' }}>Target not found in registry.</div>
                  )}
                  {modalType === 'groups' && allGroups.filter(g => `${g.groupCode} ${g.id}`.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                     <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--on-surface-variant)' }}>Squad not found in registry.</div>
                  )}
                </div>
              </motion.div>
           </motion.div>
         )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ padding: '2rem 1.5rem', background: 'linear-gradient(180deg, rgba(255, 59, 48, 0.15) 0%, rgba(9, 9, 11, 0) 100%)', borderBottom: '1px solid rgba(255, 59, 48, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button 
              onClick={() => navigate(-1)}
              style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', marginRight: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }}
            >
              <ArrowLeft size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: isReverse ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 59, 48, 0.2)', padding: '8px', borderRadius: '12px', transition: 'all 0.3s' }}>
                <ShieldAlert size={28} color={isReverse ? "#10b981" : "var(--error)"} />
              </div>
              <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', textShadow: isReverse ? '0 0 20px rgba(16, 185, 129, 0.5)' : '0 0 20px rgba(255, 59, 48, 0.5)', color: isReverse ? '#10b981' : 'var(--error)', transition: 'all 0.3s' }}>
                {isReverse ? 'Restoration Hub' : 'Command Center'}
              </h1>
            </div>
          </div>
          
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
             <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: isReverse ? 'var(--on-surface-variant)' : 'var(--error)', transition: 'color 0.3s' }}>NUKE</span>
             <div style={{ width: '36px', height: '20px', background: isReverse ? '#10b981' : 'var(--surface-variant)', borderRadius: '10px', position: 'relative', transition: 'background 0.3s' }}>
               <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: isReverse ? '18px' : '2px', transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }} />
             </div>
             <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: isReverse ? '#10b981' : 'var(--on-surface-variant)', transition: 'color 0.3s' }}>RESTORE</span>
             <input type="checkbox" checked={isReverse} onChange={(e) => setIsReverse(e.target.checked)} style={{ display: 'none' }} />
          </label>
        </div>
        <p style={{ margin: '0.5rem 0 0 0', color: 'var(--on-surface-variant)', fontSize: '0.9rem', lineHeight: '1.4' }}>
          Absolute nuclear authority over the FLYPSYDE ecosystem. With great power comes zero accountability.
        </p>
      </div>

      {/* Tabs Layout */}
      <div style={{ padding: '1.25rem 1rem' }}>
        
        {/* Horizontal Scrollable Tabs */}
        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1rem', scrollbarWidth: 'none' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.8rem 1.2rem',
                borderRadius: '16px',
                background: activeTab === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: `1px solid ${activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'}`,
                color: activeTab === tab.id ? '#fff' : 'var(--on-surface-variant)',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
};

// Subcomponent for the beautiful cards
const NuclearCard = ({ title, description, icon, actionText, onAction, danger = false, children }: { title: string, description: string, icon: React.ReactNode, actionText: string, onAction: () => void, danger?: boolean, children?: React.ReactNode }) => {
  return (
    <div 
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: `1px solid ${danger ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 255, 255, 0.08)'}`,
        borderRadius: '24px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: danger ? '0 10px 30px -10px rgba(255, 59, 48, 0.1)' : '0 10px 30px -10px rgba(0,0,0,0.5)'
      }}
    >
      {danger && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--error), transparent)' }} />
      )}
      
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ 
          background: danger ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255, 255, 255, 0.05)', 
          padding: '12px', 
          borderRadius: '16px' 
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', color: danger ? '#fff' : '#fff' }}>{title}</h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--on-surface-variant)', lineHeight: '1.5' }}>
            {description}
          </p>
        </div>
      </div>
      
      {children && (
        <div style={{ marginBottom: '1.5rem', marginTop: 'auto' }}>
          {children}
        </div>
      )}
      
      <div style={{ marginTop: children ? '0' : 'auto', paddingTop: children ? '0' : '1.5rem' }}>
        <button 
          onClick={onAction}
          style={{ 
            width: '100%', 
            padding: '1rem', 
            background: danger ? 'var(--error-dim)' : 'rgba(255,255,255,0.05)', 
            border: `1px solid ${danger ? 'var(--error)' : 'rgba(255,255,255,0.1)'}`, 
            color: danger ? '#fff' : '#fff', 
            borderRadius: '12px', 
            fontWeight: 800, 
            letterSpacing: '0.5px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textTransform: 'uppercase',
            fontSize: '0.85rem'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = danger ? 'var(--error)' : 'rgba(255,255,255,0.1)';
            if (danger) e.currentTarget.style.boxShadow = '0 0 20px rgba(255,59,48,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = danger ? 'var(--error-dim)' : 'rgba(255,255,255,0.05)';
            if (danger) e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {actionText}
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;
