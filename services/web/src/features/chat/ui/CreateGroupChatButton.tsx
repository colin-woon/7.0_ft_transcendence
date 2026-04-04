'use client';
import { useRef, useState } from 'react';
import { useFriendList } from '../models';
import { createGroupChat } from '../api/chat-services';
import type { FriendId } from '../models/chat-types';

const FALLBACK_AVATAR_URL = 'https://img.daisyui.com/images/profile/demo/yellingcat@192.webp';

export function CreateGroupChatButton() {
    const dialogRef = useRef<HTMLDialogElement>(null);
    
    // Step 2: Fetch friends & user ID
    const { allFriendships, tempCurrentUserId } = useFriendList();
    
    // Step 3: Add Form State
    const [groupName, setGroupName] = useState('');
    const [selectedFriendIds, setSelectedFriendIds] = useState<FriendId[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Toggle checkbox selection
    const handleCheckboxChange = (friendId: FriendId) => {
        setSelectedFriendIds(prev => 
            prev.includes(friendId)
                ? prev.filter(id => id !== friendId)
                : [...prev, friendId]
        );
    };

    // Step 6: Handle Group Creation
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!tempCurrentUserId || !groupName.trim() || selectedFriendIds.length === 0) return;
        
        try {
            setIsSubmitting(true);
            await createGroupChat(tempCurrentUserId, {
                name: groupName,
                memberIds: selectedFriendIds
            });
            
            // Reset and close on success
            setGroupName('');
            setSelectedFriendIds([]);
            dialogRef.current?.close();
        } catch (error) {
            console.error("Failed to create group chat", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        dialogRef.current?.close();
        setGroupName('');
        setSelectedFriendIds([]);
    };

    return (
        <div>
            <button className="btn btn-secondary" onClick={() => dialogRef.current?.showModal()}>Create Group</button>
            <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle">
                <div className="modal-box bg-secondary">
                    <h3 className="font-bold text-lg mb-4">Create Group Chat</h3>
                    
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {/* Name Input */}
                        <label className="form-control w-full">
                            <div className="label">
                                <span className="label-text font-medium">Group Name</span>
                            </div>
                            <input 
                                type="text" 
                                placeholder="Enter group name..." 
                                className="input input-bordered w-full bg-primary" 
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                required
                            />
                        </label>

                        {/* Step 4 & 5: Render Friend List with neat flex alignment */}
                        <div className="label pb-0">
                            <span className="label-text font-medium">Select Friends</span>
                        </div>
                        <div className="bg-primary border-base-300 rounded-box border p-4 max-h-64 overflow-y-auto flex flex-col gap-2">
                            {!allFriendships || allFriendships.length === 0 ? (
                                <p className="text-sm opacity-70">No friends available.</p>
                            ) : (
                                allFriendships.map(friend => (
                                    <div key={friend.friendId} className="flex justify-between items-center p-2 rounded hover:bg-base-200/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="avatar">
                                                <div className="w-10 rounded-full">
                                                    <img src={FALLBACK_AVATAR_URL} alt={`Friend ${friend.friendId}`} />
                                                </div>
                                            </div>
                                            <p className="text-sm font-medium">Friend #{friend.friendId}</p>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            className="checkbox checkbox-secondary" 
                                            checked={selectedFriendIds.includes(friend.friendId)}
                                            onChange={() => handleCheckboxChange(friend.friendId)}
                                        />
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Actions */}
                        <div className="modal-action mt-4">
                            <button type="button" className="btn" onClick={handleCloseModal}>Cancel</button>
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
            </dialog>
        </div>
    );
}