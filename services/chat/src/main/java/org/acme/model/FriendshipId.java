package org.acme.model;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class FriendshipId implements Serializable {
    public Integer requesterId;
    public Integer addresseeId;

    public FriendshipId() {}

    public FriendshipId(Integer requesterId, Integer addresseeId) {
        this.requesterId = requesterId;
        this.addresseeId = addresseeId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof FriendshipId)) return false;
        FriendshipId that = (FriendshipId) o;
        return Objects.equals(requesterId, that.requesterId) &&
               Objects.equals(addresseeId, that.addresseeId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(requesterId, addresseeId);
    }
}