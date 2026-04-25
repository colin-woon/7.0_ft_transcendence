'use client';

import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCreateGroupChatAction, useUserDisplay, BUBBLE_COLORS } from '@/features/chat/models';
import { AvatarWithStatus } from '@/features/chat/ui';

const FALLBACK_AVATAR_URL = 'https://img.daisyui.com/images/profile/demo/yellingcat@192.webp';

export function CreateGroupChatButton() {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [mounted, setMounted] = useState(false); // <-- Add mounted state to prevent SSR hydration errors

    const {
        groupName,
        setGroupName,
        selectedFriendIds,
        toggleFriendId,
        isSubmitting,
        submitGroupChat,
        resetForm,
        allAcceptedFriends
    } = useCreateGroupChatAction();

    const friendIds = allAcceptedFriends?.map(f => f.friendId) || [];
    const resolveDisplay = useUserDisplay(friendIds);
    
    // Ensure we only render the portal on the client-side
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleCloseModal = () => {
        dialogRef.current?.close();
        resetForm();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await submitGroupChat(() => {
            dialogRef.current?.close();
        });
    };

    return (
        <>
            <button className="btn btn-ghost w-full justify-start gap-3 font-normal text-base-content/80 hover:bg-base-300/50 h-auto py-3 rounded-md" onClick={() => dialogRef.current?.showModal()}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            Create Group
            </button>
            
            {/* Render the modal in a Portal attached to the document body */}
            {mounted && createPortal(
                <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle text-base-content">
                    <div className="modal-box bg-base-100 shadow-xl border border-base-300">
                        <h3 className="font-bold text-lg mb-4">Create Group Chat</h3>
                        
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <label className="form-control w-full">
                                <div className="label">
                                    <span className="label-text font-medium">Group Name</span>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Enter group name..." 
                                    className="input input-bordered w-full bg-base-200" 
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    required
                                />
                            </label>

                            <div className="label pb-0">
                                <span className="label-text font-medium">Select Friends</span>
                            </div>
                            <div className="bg-base-200 border-base-300 rounded-box border p-4 max-h-64 overflow-y-auto flex flex-col gap-2">
                                {!allAcceptedFriends || allAcceptedFriends.length === 0 ? (
                                    <p className="text-sm opacity-70">No friends available.</p>
                                ) : (
                                    allAcceptedFriends.map(friend => {
                                        const { displayName, avatarImage } = resolveDisplay(friend.friendId);
                                        const initials = displayName.substring(0, 2).toUpperCase() || '??';
                                        const color = BUBBLE_COLORS[friend.friendId % BUBBLE_COLORS.length];
                                        
return (
                                            <div key={friend.friendId} className="flex justify-between items-center p-2 rounded hover:bg-base-500/50 ">
                                                <div className="flex items-center gap-3">
                                                    <AvatarWithStatus
                                                        userId={friend.friendId}
                                                        name={displayName}
                                                        initials={initials}
                                                        avatarImage={avatarImage}
                                                        color={color}
                                                    />
                                                    <p className="text-sm font-medium">{displayName}</p>
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    className="checkbox checkbox-secondary" 
                                                    checked={selectedFriendIds.includes(friend.friendId)}
                                                    onChange={() => toggleFriendId(friend.friendId)}
                                                />
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="modal-action mt-4">
                                <button type="button" className="btn btn-ghost" onClick={handleCloseModal}>Cancel</button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={!groupName.trim() || selectedFriendIds.length === 0 || isSubmitting}
                                >
                                    {isSubmitting ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                    {/* Click outside to close */}
                    <form method="dialog" className="modal-backdrop">
                        <button onClick={handleCloseModal}>close</button>
                    </form>
                </dialog>,
                document.body
            )}
        </>
    );
}