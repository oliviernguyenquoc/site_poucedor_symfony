<?php

namespace Pouce\TeamBundle\Entity;

use Gedmo\Mapping\Annotation as Gedmo;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Anecdote
 *
 * @ORM\Table(name="anecdote")
 * @ORM\Entity(repositoryClass="Pouce\TeamBundle\Entity\AnecdoteRepository")
 */
class Anecdote
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
     * @ORM\ManyToOne(targetEntity="Pouce\TeamBundle\Entity\Team")
     * @ORM\JoinColumn(nullable=false)
    */
    private $team;

    /**
     * @var string
     * @Assert\NotBlank()
     * @Assert\NotNull()
     * @Assert\Length(min="3")
     *
     * @ORM\Column(name="name", type="string", length=500)
     */
    private $name;

    /**
     * @var datetime $created
     *
     * @Gedmo\Timestampable(on="create")
     * @ORM\Column(type="datetime")
     */
    private $created;

    /**
     * @var \DateTime $updated
     *
     * @Gedmo\Timestampable(on="update")
     * @ORM\Column(type="datetime")
     */
    private $updated;


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
     * Set name
     *
     * @param string $name
     * @return Anecdote
     */
    public function setName($name)
    {
        $this->name = $name;

        return $this;
    }

    /**
     * Get name
     *
     * @return string 
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * Set created
     *
     * @param \DateTime $created
     * @return Anecdote
     */
    public function setCreated($created)
    {
        $this->created = $created;

        return $this;
    }

    /**
     * Get created
     *
     * @return \DateTime 
     */
    public function getCreated()
    {
        return $this->created;
    }

    /**
     * Set updated
     *
     * @param \DateTime $updated
     * @return Anecdote
     */
    public function setUpdated($updated)
    {
        $this->updated = $updated;

        return $this;
    }

    /**
     * Get updated
     *
     * @return \DateTime 
     */
    public function getUpdated()
    {
        return $this->updated;
    }

    /**
     * Set team
     *
     * @param \Pouce\TeamBundle\Entity\Team $team
     * @return Anecdote
     */
    public function setTeam(\Pouce\TeamBundle\Entity\Team $team)
    {
        $this->team = $team;

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
}
