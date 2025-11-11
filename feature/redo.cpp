#include <deque>
#include <utility>

namespace editor {

template <typename T>
class UndoRedo {
public:
    explicit UndoRedo(std::size_t maxHistory = 500)
        : maxHistory_(maxHistory) {}

    // Push a new state. Clears redo history if any.
    void push(const T& state) {
        if (!undoStack_.empty() && undoStack_.back() == state) {
            return; // no-op if identical to current
        }
        undoStack_.push_back(state);
        redoStack_.clear();
        enforceCapacity();
    }

    void push(T&& state) {
        if (!undoStack_.empty() && undoStack_.back() == state) {
            return; // no-op if identical to current
        }
        undoStack_.push_back(std::move(state));
        redoStack_.clear();
        enforceCapacity();
    }

    // Move one step back; returns pointer to new current state or nullptr if none.
    const T* undo() {
        // Do not allow undo past the earliest state
        if (undoStack_.size() <= 1) return currentPtr();
        // Move current to redo, reveal previous as current
        T current = std::move(undoStack_.back());
        undoStack_.pop_back();
        redoStack_.push_back(std::move(current));
        return currentPtr();
    }

    // Move one step forward; returns pointer to new current state or nullptr if none.
    const T* redo() {
        if (redoStack_.empty()) return nullptr;
        undoStack_.push_back(std::move(redoStack_.back()));
        redoStack_.pop_back();
        return currentPtr();
    }

    const T* current() const { return currentPtr(); }

    bool canUndo() const { return undoStack_.size() > 1; }
    bool canRedo() const { return !redoStack_.empty(); }

    void clear() {
        undoStack_.clear();
        redoStack_.clear();
    }

    std::size_t undoSize() const { return undoStack_.size(); }
    std::size_t redoSize() const { return redoStack_.size(); }

    void setMaxHistory(std::size_t maxHistory) {
        maxHistory_ = maxHistory;
        enforceCapacity();
    }

    std::size_t maxHistory() const { return maxHistory_; }

private:
    const T* currentPtr() const {
        if (undoStack_.empty()) return nullptr;
        return &undoStack_.back();
    }

    void enforceCapacity() {
        if (maxHistory_ == 0) return;
        while (undoStack_.size() > maxHistory_) {
            undoStack_.pop_front();
        }
        while (redoStack_.size() > maxHistory_) {
            redoStack_.pop_front();
        }
    }

    std::deque<T> undoStack_;
    std::deque<T> redoStack_;
    std::size_t maxHistory_;
};

} 


