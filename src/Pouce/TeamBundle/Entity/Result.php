<?php

namespace Pouce\TeamBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Result
 *
 * @ORM\Table(name="result")
 * @ORM\Entity(repositoryClass="Pouce\TeamBundle\Entity\ResultRepository")
 */
class Result
{
    /**
     * @var integer
     *
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @ORM\ManyToOne(targetEntity="Pouce\SiteBundle\Entity\Edition")
     * @ORM\JoinColumn(nullable=false)
    */
    private $edition;

    /**
     * @ORM\OneToOne(targetEntity="Pouce\TeamBundle\Entity\Team", inversedBy="result")
    */
    private $team;

    /**
     * @ORM\OneToOne(targetEntity="Pouce\TeamBundle\Entity\Comment", cascade={"persist"})
     */
    private $comment;

    /**
     * @var integer
     *
     * @ORM\Column(name="lateness", type="integer")
     */
    private $lateness;

    /**
     * @var boolean
     *
     * @ORM\Column(name="isValid", type="boolean")
     */
    private $isValid;

    /**
     * @ORM\OneToOne(targetEntity="Pouce\TeamBundle\Entity\Position", cascade={"persist"})
     * @ORM\JoinColumn(nullable=false)
    */
    private $position;

    /**
     * @var integer
     *
     * @ORM\Column(name="rank", type="integer")
     */
    private $rank;

    /**
     * Get id
     *
     * @return integer 
     */
    public function getId()
    {
        return $this->id;
    }


    /**
     * Set lateness
     *
     * @param integer $lateness
     * @return Result
     */
    public function setLateness($lateness)
    {
        $this->lateness = $lateness;

        return $this;
    }

    /**
     * Get lateness
     *
     * @return integer 
     */
    public function getLateness()
    {
        return $this->lateness;
    }

    /**
     * Set isValid
     *
     * @param boolean $isValid
     * @return Result
     */
    public function setIsValid($isValid)
    {
        $this->isValid = $isValid;

        return $this;
    }

    /**
     * Get isValid
     *
     * @return boolean 
     */
    public function getIsValid()
    {
        return $this->isValid;
    }

    /**
     * Set edition
     *
     * @param \Pouce\SiteBundle\Entity\Edition $edition
     * @return Result
     */
    public function setEdition(\Pouce\SiteBundle\Entity\Edition $edition)
    {
        $this->edition = $edition;

        return $this;
    }

    /**
     * Get edition
     *
     * @return \Pouce\SiteBundle\Entity\Edition 
     */
    public function getEdition()
    {
        return $this->edition;
    }

    /**
     * Set team
     *
     * @param \Pouce\TeamBundle\Entity\Team $team
     * @return Result
     */
    public function setTeam(\Pouce\TeamBundle\Entity\Team $team)
    {
        $this->team = $team;

        $team->setResult($this);

        return $this;
    }

    /**
     * Get team
     *
     * @return \Pouce\TeamBundle\Entity\Team 
     */
    public function getTeam()
    {
        return $this->team;
    }

    /**
     * Set position
     *
     * @param \Pouce\TeamBundle\Entity\Position $position
     * @return Result
     */
    public function setPosition(\Pouce\TeamBundle\Entity\Position $position)
    {
        $this->position = $position;

        return $this;
    }

    /**
     * Get position
     *
     * @return \Pouce\TeamBundle\Entity\Position 
     */
    public function getPosition()
    {
        return $this->position;
    }

    /**
     * Set rank
     *
     * @param integer $rank
     * @return Result
     */
    public function setRank($rank)
    {
        $this->rank = $rank;

        return $this;
    }

    /**
     * Get rank
     *
     * @return integer 
     */
    public function getRank()
    {
        return $this->rank;
    }

    /**
     * Set comment
     *
     * @param \Pouce\TeamBundle\Entity\Comment $comment
     * @return Result
     */
    public function setComment(\Pouce\TeamBundle\Entity\Comment $comment = null)
    {
        $this->comment = $comment;

        return $this;
    }

    /**
     * Get comment
     *
     * @return \Pouce\TeamBundle\Entity\Comment 
     */
    public function getComment()
    {
        return $this->comment;
    }
}
